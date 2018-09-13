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
            let methodId;
            switch(qmMethod.type) {
            case 'clustering.kmeans':
                methodId = this._kmeansClustering(base, qmMethod, subset, fields);
                break;
            case 'visualization':
                methodId = this._visualizationSetup(base, qmMethod, subset, fields);
                break;
            case 'filter.manual':
                methodId = this._filterByQuery(base, qmMethod, subset, fields);
                break;
            }

            if (methodId instanceof Error) {
                // something went wrong return an error
                return { errors: { msg: 'createMethod: cannot initialize method - invalid method parameters' } };
            } else {
                // store the method into the database
                return this.get(base, methodId);
            }
        } else {
            return { errors: { msg: `createMethod: No subset with id=${method.appliedOn}` } };
        }
    },

    /**
     * Creates a method record in the database.
     * @param {Object} base - The QMiner base object.
     * @param {String | Number} id - The id of the method.
     * @returns {Object} The method object.
     */
    get(base, id) {

        function getMethodRelatedSubsets(method, fieldName) {
            let subsets = method[fieldName];
            if (subsets && subsets.length && subsets[0].deleted !== undefined) {
                subsets.filterByField('deleted', false);
            }
            return subsets.map(subset => formatter.subset(subset));
        }

        // TODO: log activity
        let methods = base.store('Methods');
        let response = { methods: null, meta: null };
        // if id is a number
        if (!isNaN(parseFloat(id))) {
            // validate id
            if (id < 0 || methods.length <= id) {
                // handle id missmatch
                return { errors: { msg: 'The method id does not match with any existing methods' } };
            }
            // get the method from database
            let method = methods[id];
            response.methods = formatter.method(method);

            // subset information
            response.subsets = [ ];
            if (!method.appliedOn.empty) {
                // set the resulted in method
                let appliedOnSubsets = getMethodRelatedSubsets(method, 'appliedOn');
                response.subsets = response.subsets.concat(appliedOnSubsets);
            }
            if (!method.produced.empty) {
                // get methods that used the subset
                let producedSubsets = getMethodRelatedSubsets(method, 'produced');
                response.subsets = response.subsets.concat(producedSubsets);
            }
            // remove the 'methods' property if none were given
            if (!response.subsets.length) { delete response.subsets; }

         } else {
            let allMethods = methods.allRecords;
            if (allMethods && allMethods.length && allMethods[0].deleted !== undefined) {
                allMethods.filterByField('deleted', false);
            }
            response.methods = allMethods.map(rec => formatter.method(rec));
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
     * Set the deleted flag for the method and all its joins.
     * @param {Object} base - The QMiner base object.
     * @param {String | Number} id - The id of the method.
     */
    delete(base, id) {
        let methods = base.store('Methods');
        if (!isNaN(parseFloat(id))) {
            let method = methods[id];
            // if no subset or already deleted just skip
            if (!method || method.deleted) { return { }; }
            // set the deleted flag to true
            if (method.deleted !== undefined && method.deleted === false) {
                 // iterate through it's joins
                 for (let i = 0; i < method.produced.length; i++) {
                    let subset = method.produced[i];
                    require('./subset-handler').delete(base, subset.$id);
                }
                methods[id].deleted = true;
            }
        }
        return  { };
    },

    /**
     * Aggregate subset with given id.
     * @param {Object} base - The QMiner base object.
     * @param {Object} id - The subset id used to update.
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
                result: { aggregates: [ ] }
            };
            // iterate through the fields
            for (let field of fields) {
                // get aggregate distribution
                if (field.aggregate) {
                    let distribution = this._aggregateByField(elements, field);
                    method.result.aggregates.push({
                        field: field.name,
                        type: field.aggregate,
                        distribution
                    });
                }
            }
            // join the created method with the applied subset
            let methodId = base.store('Methods').push(method);
            base.store('Methods')[methodId].$addJoin('appliedOn', subset.$id);
            // store the method into the database
            return this.get(base, methodId);

        } else {
            return { errors: { msg: `aggregateSubset: No subset with id=${id}` } };
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

        let distribution;
        if (aggregate === 'hierarchy') {
            // calculate the hierarchical structure of the field
            distribution = [];
            for (let id = 0; id < elements.length; id++) {
                if (elements[id][fieldName]) {
                    const fieldVals = elements[id][fieldName].toArray();
                    this._addChild(distribution, fieldVals[0], fieldVals.slice(1));
                }
            }
        } else {
            // aggregate params
            let aggregateParams = {
                name: `${aggregate}_${fieldName}`,
                field: fieldName,
                type: aggregate
            };
            // calculate the aggregates for the record set
            distribution = elements.aggr(aggregateParams);
        }
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
                    hashDimension: 20000
                },{
                    type: 'constant',
                    const: 0.0001
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
            return new Error('Features are not in correct schema');
        }

        /////////////////////////////////////////
        // Validate KMeans parameter
        /////////////////////////////////////////
        if (!validator.validateSchema(query.parameters.method, validator.schemas.methodKMeansParams)) {
            // method parameters are not in correct schema - set query
            // to Error and exist this function
            return new Error('KMeans parameters are not in correct schema');
        }

        // create the feature space using the validated features object
        let featureSpace = new qm.FeatureSpace(base, features);

        // get subset elements and update the feature space
        const documents = subset.hasElements;
        featureSpace.updateRecords(documents);

        // get matrix representation of the documents
        const matrix = featureSpace.extractSparseMatrix(documents);

        // TODO: support dimensionality reduction

        // create kmeans model and feed it the sparse document matrix
        let kMeans = new qm.analytics.KMeans(query.parameters.method);
        kMeans.fit(matrix);

        // get the document-cluster affiliation
        const idxv = kMeans.getModel().idxv;

        // prepare clusters array in the results
        query.result = {
            clusters: Array.apply(null, Array(query.parameters.method.k))
                .map(() => ({
                    avgSimilarity: null,
                    docIds: [ ],
                    aggregates: [ ],
                    subset: {
                        created: false,
                        id: null
                    }
                }))
        };

        let clusterDocuments = { };
        // populate the cluster results
        for (let id = 0; id < idxv.length; id++) {
            const docId = documents[id].$id;
            const clusterId = idxv[id];
            // store the document id in the correct cluster
            query.result.clusters[clusterId].docIds.push(docId);

            // save positions of documents of particular cluster
            if (clusterDocuments[clusterId]) {
                clusterDocuments[clusterId].push(id);
            } else {
                clusterDocuments[clusterId] = [id];
            }
        }

        /**
         * Formats the qminer record document.
         * @param {qm.Record} document - The document to be formated.
         * @returns {Object} The document in json format.
         */
        function formatDocuments(document) {
            return formatter.document(document);
        }


        // calculate the average distance between cluster documents and centroid
        for (let clusterId of Object.keys(clusterDocuments)) {
            // get document submatrix
            let positions = new qm.la.IntVector(clusterDocuments[clusterId]);
            let submatrix = matrix.getColSubmatrix(positions);
            let centroid = kMeans.centroids.getCol(parseInt(clusterId));
            if (query.parameters.method.distanceType === 'Cos') {
                // normalize the columns for cosine similiary
                submatrix.normalizeCols();
                centroid.normalize();
            }
            // get distances between documents and centroid
            let distances = submatrix.multiplyT(centroid);
            if (query.parameters.method.distanceType === 'Cos') {
                query.result.clusters[clusterId].avgSimilarity = distances.sum() / submatrix.cols;
            }
            // sort distances with their indeces
            let sort = distances.sortPerm(false);
            let idVec = qm.la.IntVector();
            // set number of documents were interested in
            let maxCount = 100;
            if (maxCount > sort.perm.length) {
                // the threshold is larger than the similarity vector
                maxCount = sort.perm.length;
            }

            for (let i = 0; i < maxCount; i++) {
                // get content id of (i+1)-th most similar content
                let maxid = sort.perm[i];
                // else remember the content and it's similarity
                idVec.push(positions[maxid]);
            }
            // get elements in the cluster
            const documents = base.store('Dataset').newRecordSet(idVec);
            // get document sample
            query.result.clusters[clusterId].documentSample = documents.map(formatDocuments);

        }

        let subsetLabels = [ ];
        // for each cluster calculate the aggregates
        for (let i = 0; i < query.result.clusters.length; i++) {
            // get elements in the cluster
            const documentIds = new qm.la.IntVector(query.result.clusters[i].docIds);
            const documents = base.store('Dataset').newRecordSet(documentIds);
            // iterate through the fields
            for (let field of fields) {
                // get aggregate distribution
                if (field.aggregate) {
                    let distribution = this._aggregateByField(documents, field);
                    query.result.clusters[i].aggregates.push({
                        field: field.name,
                        type: field.aggregate,
                        distribution
                    });
                }
            }

            // set cluster label out of the first keyword cloud
            let label;
            for (let aggregate of query.result.clusters[i].aggregates) {
                if (query.parameters.fields.includes(aggregate.field) && aggregate.distribution) {
                    if (query.parameters.method.clusteringType === 'text') {
                        // get the aggregates keyword distribution
                        label = aggregate.distribution.keywords.slice(0, 3)
                            .map(keyword => keyword.keyword).join(', ');
                        break;
                    } else if (query.parameters.method.clusteringType === 'number') {
                        // get the histogram distribution
                        let min = aggregate.distribution.min;
                        let max = aggregate.distribution.max;
                        if (Math.abs(min) < 1) { min = min.toFixed(2); }
                        if (Math.abs(max) < 1) { max = max.toFixed(2); }
                        label = `${min} <= count <= ${max}`;
                        break;
                    }
                }
            }

            // if label was not assigned - set a lame label
            if (!label) { label = `Cluster #${i+1}`; }

            // set the subset/cluster label
            subsetLabels.push({ label, clusterId: i });
        }

        // join the created method with the applied subset
        let methodId = base.store('Methods').push(query);
        base.store('Methods')[methodId].$addJoin('appliedOn', subset.$id);

        // create subsets using the cluster information
        for (let labelObj of subsetLabels) {
            let subset = {
                label: labelObj.label,
                description: null,
                resultedIn: methodId,
                meta: { clusterId: labelObj.clusterId }
            };
            // create subset and get its id
            let { subsets: { id } } = require('./subset-handler').create(base, subset);
            // aggregate the given subset
            this.aggregateSubset(base, id, fields);
            // join the produced subset with the method
            base.store('Methods')[methodId].$addJoin('produced', id);
        }

        return methodId;
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
        // create subset for the given cluster
        let methodId = base.store('Methods').push(query);
        base.store('Methods')[methodId].$addJoin('appliedOn', subset.$id);
        return methodId;
    },

    /**
     * Set the filter method result.
     * @param {Object} base - The QMiner base object.
     * @param {Object} query - Method parameters.
     * @param {Object} subset - The subset object.
     * @param {Object[]} fields - The fields in the database (not used in method).
     * @private
     */
    _filterByQuery(base, query, subset, fields) {
        // prepare qminer query
        let qmQuery = {
            $join: {
                $name: 'hasElements',
                $query: {
                    $from: 'Subsets',
                    $id: subset.$id
                }
            }
        };

        // add additional queries - keywords
        let queryParams = query.parameters.query;
        if (queryParams && queryParams.text) {
            qmQuery.$or = [ ];
            for (let field of queryParams.text.fields) {
                // add field and value to the query
                let fieldQuery = { };
                fieldQuery[field] = queryParams.text.keywords;
                qmQuery.$or.push(fieldQuery);
            }
        }
        // add additional queries - ranges
        if (queryParams && queryParams.number) {
            for (let field of queryParams.number) {
                // add field and value to the query
                qmQuery[field.field] = {
                    $gt: parseFloat(field.values[0]),
                    $lt: parseFloat(field.values[1])
                };
            }
        }
        // get the subset documents
        let subsetDocuments = base.search(qmQuery);

        query.result = { docIds: [] };
        // populate the cluster results
        for (let id = 0; id < subsetDocuments.length; id++) {
            const docId = subsetDocuments[id].$id;
            // store the document id in the correct cluster
            query.result.docIds.push(docId);
        }

        // create subset for the given cluster
        let methodId = base.store('Methods').push(query);
        base.store('Methods')[methodId].$addJoin('appliedOn', subset.$id);
        return methodId;
    },

    /**
     * Add the current value of the hierarchy to the children array.
     * @param {Object[]} children - The array of children.
     * @param {String} value - The current observed value in the hierarchy.
     * @param {String[]} other - Children of the value.
     * @private
     */
    _addChild(children, value, other) {
        if (other.length) {
            // check if there is already a child included with this value
            let object;
            for (let child of children) {
                if (child.name === value) {
                    if (!child.children) { child.children = []; }
                    object = child;
                    break;
                }
            }
            if (!object) {
                let len = children.push({ name: value, children: [] });
                object = children[len - 1];
            }
            this._addChild(object.children, other[0], other.slice(1));

        } else {
            // value is the last in the array - add it and it's size to the
            // the children object
            let included = false;
            for (let child of children) {
                if (child.name === value) {
                    child.size += 1;
                    included = true;
                    break;
                }
            }
            if (!included) {
                children.push({ name: value, size: 1 });
            }
        }
    }

};