// external libraries
const qm = require('qminer');

// the formatter function for subset, method and documents
const formatter = require('./formatter');

// schema validator
const validator = require('../validator')({
    featureSchema:      require('../../schemas/base-dataset/features-schema'),
    methodKMeansParams: require('../../schemas/base-dataset/method-kmeans-params')
});

module.exports = {

    /**
     * Creates a method record in the database.
     * @param {Object} base - The QMiner base object.
     * @param {Object} method - The method to store.
     * @param {String} method.type - The type of the method.
     * @param {Object} method.parameters - The parameters of the method.
     * @param {Object} method.result - The result of the method.
     * @param {Number} method.appliedOn - The id of the subset the method was applied on.
     * @param {Object[]} fields - The fields in the database.
     */
    create(base, method, fields) {
         // TODO: log activity

         // prepare method object
         let qmMethod = {
             type:       method.type,
             parameters: method.parameters,
             result:     method.result
         };
 
         // get subset on which the method was used
         let subset = base.store('Subsets')[method.appliedOn];
         if (subset) {
 
             switch(qmMethod.type) {
             case 'clustering.kmeans':
                this._kmeansClustering(base, qmMethod, subset, fields);
                 break;
             case 'visualization':
                 this._visualizationSetup(base, qmMethod, subset, fields);
             }
 
             if (qmMethod instanceof Error) {
                 // something went wrong return an error
                 throw { errors: { message: 'createMethod: cannot initialize method - invalid method parameters' } };
             } else {
                // store the method into the database
                let methodId = base.store('Methods').push(qmMethod);
                base.store('Methods')[methodId].$addJoin('appliedOn', subset);
                return { methods: formatter.method(base.store('Methods')[methodId]) };
             }
         } else {
             return { errors: { message: `createMethod: No subset with id=${method.appliedOn}` } };
         }
    },

    /**
     * Creates a method record in the database.
     * @param {Object} base - The QMiner base object.
     * @param {String | Number} id - The id of the method.
     * @returns {Object} The method object.
     */
    get(base, id) {
         // TODO: log activity

         let methods = base.store('Methods');
         let response = { methods: null, meta: null };
         // if id is a number
         if (!isNaN(parseFloat(id))) {
             // validate id
             if (id < 0 || methods.length <= id) {
                 // handle id missmatch
                 return { errors: { message: 'The method id does not match with any existing methods' } };
             }
             // get the method from database
             let method = methods[id];
             response.methods = formatter.method(method);

             // subset information
             response.subsets = [ ]; 
             if (!method.appliedOn.empty) {
                 // set the resulted in method
                 let appliedOnSubsets = method.appliedOn.map(subset => formatter.subset(subset));
                 response.subsets = response.subsets.concat(appliedOnSubsets);
             }
             if (!method.produced.empty) {
                 // get methods that used the subset
                 let producedSubsets = method.produced.map(subset => formatter.subset(subset));
                 response.subsets = response.subsets.concat(producedSubsets);
             }
             // remove the 'methods' property if none were given
             if (!response.subsets.length) { delete response.subsets; }
 
         } else {
            response.methods = methods.allRecords
                 .map(rec => formatter.method(rec));
         }
         // return the methods
         return response;
    },

    /**
     * Edit a method record in the database.
     * @param {Object} base - The QMiner base object.
     * @param {Object} methodInfo - The method data used to update.
     * @returns {Object} The updated method object.
     */
    set(base, methodInfo) {
        // TODO: log activity
        // get method information and update state
        let method = base.store('Methods')[methodInfo.methodId];

        if (methodInfo.result) {
            let result = method.result;
            if (method.type === 'clustering.kmeans') {
                for (let clusterId = 0; clusterId < result.clusters.length; clusterId++) {
                    result.clusters[clusterId].label = methodInfo.result.clusters[clusterId].label;
                }
            }
            method.result = result;
        }
        return { methods: formatter.method(method) };
    },

    /**
     * Aggregate subset with given id.
     * @param {Object} base - The QMiner base object.
     * @param {Object} id - The method data used to update.
     * @param {Object[]} fields - The fields in the database.
     * @returns {Object} The subset aggregates method.
     */
    aggregateSubset(base, id, fields) {
        // TODO: log activity
        const subset = base.store('Subsets')[id];
        if (subset) {
            // get dataset fields and subset elements
            const elements = subset.hasElements;

            // store the method
            let method = {
                type: 'aggregate.subset',
                parameters: { id },
                result: { aggregates: [ ] },
                appliedOn: id
            };
            // iterate through the fields
            for (let field of fields) {
                // get aggregate distribution
                let distribution = this._aggregateByField(elements, field);
                method.result.aggregates.push({ 
                    field: field.name, 
                    type: field.aggregate, 
                    distribution 
                });
            }
            // save the method
            return this.create(base, method, fields);

        } else {
            return { errors: { message: `aggregateSubset: No subset with id=${id}` } };
        }
    },


    /**
     * Aggregates elements by field and type.
     * @param {RecordSet} elements - A record set of elements.
     * @param {Object} field - Object containing field name and type.
     * @returns The results of the aggregation.
     * @private
     */
    _aggregateByField(elements, field) {
        // TODO: check if field exists
        const fieldName = field.name;
        const aggregate = field.aggregate;
        // calculate the aggregates for the record set
        let distribution = elements.aggr({ 
            name: `${aggregate}_${fieldName}`, 
            field: fieldName, 
            type: aggregate 
        });
        return distribution;
    },

    /**
     * Cluster the subset using KMeans and save results in query.
     * @param {Object} base - The QMiner base object.
     * @param {Object} query - Method parameters.
     * @param {Object} subset - The subset object.
     * @param {Object[]} fields - The fields in the database.
     * @private
     */
    _kmeansClustering(base, query, subset, fields) {

        let features;
        // set kmeans and features space parameters
        switch (query.parameters.method.clusteringType) {
            case 'text':
                // set kmeans and features space parameters
                query.parameters.method.distanceType = 'Cos';
                features = [{
                    type: 'text', 
                    field: query.parameters.fields,
                    ngrams: 2, 
                    hashDimension: 200000
                }]; break;
            case 'number':
                query.parameters.method.distanceType = 'Euclid';
                features = query.parameters.fields.map(fieldName => ({
                    type: 'numeric', 
                    field: fieldName
                })); break;
        }
        query.parameters.method.allowEmpty = false;
        features.forEach(feature => { feature.source = 'Dataset'; });

        /////////////////////////////////////////
        // Validate features object
        /////////////////////////////////////////
        if (!validator.validateSchema(features, validator.schemas.featureSchema)) {
            // features object is not in correct schema - set query
            // to Error and exit this function
            query = new Error('Features are not in correct schema');
            return;
        }

        /////////////////////////////////////////
        // Validate KMeans parameter
        /////////////////////////////////////////
        if (!validator.validateSchema(query.parameters.method, validator.schemas.methodKMeansParams)) {
            // method parameters are not in correct schema - set query
            // to Error and exist this function
            query = new Error('KMeans parameters are not in correct schema');
            return;
        }

        // create the feature space using the validated features object
        let featureSpace = new qm.FeatureSpace(base, features);

        // get subset elements and update the feature space
        const documents = subset.hasElements;
        featureSpace.updateRecords(documents);

        // get matrix representation of the documents
        const matrix = featureSpace.extractSparseMatrix(documents);

        // create kmeans model and feed it the sparse document matrix
        let kMeans = new qm.analytics.KMeans(query.parameters.method); 
        kMeans.fit(matrix);
        
        // get the document-cluster affiliation
        const idxv = kMeans.getModel().idxv;

        // prepare clusters array in the results
        query.result = {
            clusters: Array.apply(null, Array(query.parameters.method.k))
                .map(() => ({ 
                    docIds: [ ], 
                    aggregates: [ ], 
                    subset: { 
                        created: false, 
                        id: null 
                    } 
                }))
        };

        // populate the cluster results
        for (let id = 0; id < idxv.length; id++) {
            const docId = documents[id].$id;
            const clusterId = idxv[id];
            // store the document id in the correct cluster
            query.result.clusters[clusterId].docIds.push(docId);
        }

        // for each cluster calculate the aggregates
        for (let i = 0; i < query.result.clusters.length; i++) {
            // get elements in the cluster
            const documentIds = new qm.la.IntVector(query.result.clusters[i].docIds);
            const clusterDocuments = base.store('Dataset').newRecordSet(documentIds);

            // iterate through the fields
            for (let field of fields) {
                // get aggregate distribution
                let distribution = this._aggregateByField(clusterDocuments, field);
                query.result.clusters[i].aggregates.push({ 
                    field: field.name, 
                    type: field.aggregate, 
                    distribution 
                });
            }

            // set cluster label out of the first keyword cloud
            let label;
            for (let aggregate of query.result.clusters[i].aggregates) {
                if (aggregate.type === 'keywords' && aggregate.distribution) {
                    label = aggregate.distribution.keywords.slice(0, 3)
                        .map(keyword => keyword.keyword).join(', ');
                    break;
                }
            }

            // if label was not assigned - set a lame label
            // TODO: intelligent label setting
            if (!label) { label = `Cluster #${i+1}`; }
            
            // set the cluster label
            query.result.clusters[i].label = label;
        }
    },

    /**
     * Set the visualization method result.
     * @param {Object} base - The QMiner base object (not used in method).
     * @param {Object} query - Method parameters.
     * @param {Object} subset - The subset object (not used in method).
     * @param {Object[]} fields - The fields in the database (not used in method).
     * @private
     */
    _visualizationSetup(base, query, subset, fields) {
        query.result = 'visualization';
    }

};