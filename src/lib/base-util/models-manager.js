// external libraries
const qm = require('qminer');

const ClusteringKMeans = require('./models/clustering-kmeans');
const ActiveLearner = require('./models/active-learner');

class ModelsManager {

    constructor(formatter, validator) {
        this._modelStatus = { };
        this._formatter = formatter;
        this._validator = validator;
    }

    setFormatter(formatter) {
        this._formatter = formatter;
    }

    setValidator(validator) {
        this._validator = validator;
    }

    /**
     * Creates a method record in the database.
     * @param {Object} base - The QMiner base object.
     * @param {Object} method - The method to store.
     * @param {String} method.type - The type of the method.
     * @param {Object} method.parameters - The parameters of the method.
     * @param {Object} method.result - The result of the method.
     * @param {Number} method.appliedOn - The id of the subset the method was applied on.
     * @param {Object[]} fields - The fields in the database.
     * @param {Function} createSubsetCb - The function executed for creating subsets.
     */
    createModel(base, method, fields, createSubsetCb) {
        let self = this;
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
                // create new clustering process
                let clusteringKMeans = new ClusteringKMeans(base, qmMethod, subset, fields, self._formatter);
                // store and get the clustering model hash indentifier
                const hash = this._createModelStatus(clusteringKMeans);
                // run the clustering process
                clusteringKMeans.run(self._clusteringKMeansCreateSubsets(base, hash, createSubsetCb));
                // return the hash with the status report
                return { hash, status: 'processing' };
            case 'visualization':
                // save the methodId and return the status report
                methodId = self._visualizationSetup(base, qmMethod, subset, fields, createSubsetCb);
                return { status: 'finished', methodId };
            case 'filter.manual':
                // save the methodId and return the status report
                methodId = self._filterByQuery(base, qmMethod, subset, fields, createSubsetCb);
                return { status: 'finished', methodId };
            case 'classify.active-learning':
                let { model } = self._modelStatus[method.parameters.hash];
                methodId = model.run(self._saveActiveLearning(base, createSubsetCb));
                return { status: 'finished', methodId };
            }
            // something went wrong return an error
            return { errors: { msg: 'createMethod: cannot initialize method - invalid method parameters' } };

        } else {
            return { errors: { msg: `createMethod: No subset with id=${method.appliedOn}` } };
        }
    }

    /**
     * Creates a method record in the database.
     * @param {Object} base - The QMiner base object.
     * @param {String | Number} id - The id of the method.
     * @returns {Object} The method object.
     */
    getModel(base, id) {
        let self = this;
        function getMethodRelatedSubsets(method, fieldName) {
            let subsets = method[fieldName];
            if (subsets && subsets.length && subsets[0].deleted !== undefined) {
                subsets.filterByField('deleted', false);
            }
            return subsets.map(subset => self._formatter.subset(subset));
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
            response.methods = self._formatter.method(method);

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
            response.methods = allMethods.map(rec => self._formatter.method(rec));
        }
         // return the methods
         return response;
    }

    /**
     * Edit a method record in the database.
     * @param {Object} base - The QMiner base object.
     * @param {Object} methodInfo - The method data used to update.
     * @returns {Object} The updated method object.
     */
    updateModel(base, methodInfo) {
        let self = this;
        // TODO: log activity
        // get method information and update state
        let method = base.store('Methods')[methodInfo.methodId];

        if (methodInfo.result) {
            let result = method.result;
            if (method.type === 'clustering.kmeans') {
                for (let clusterId = 0; clusterId < result.clusters.length; clusterId++) {
                    result.clusters[clusterId].label = methodInfo.result.clusters[clusterId].label;
                }
            } else if (method.type === 'classify.active-learning') {
                for (let type of Object.keys(methodInfo.result)) {
                    result[type].label = methodInfo.result[type].label;
                }
            }
            method.result = result;
        }
        return { methods: self._formatter.method(method) };
    }

    /**
     * Set the deleted flag for the method and all its joins.
     * @param {Object} base - The QMiner base object.
     * @param {String | Number} id - The id of the method.
     * @param {Function} deleteSubsetCb - The function called to delete the associated subset.
     */
    deleteModel(base, id, deleteSubsetCb) {
        let self = this;
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
                    deleteSubsetCb(base, subset.$id, self.deleteModel.bind(self));
                }
                methods[id].deleted = true;
            }
        }
        return { };
    }

    /**********************************
     * Active Learning Methods
     *********************************/

    createMethodActiveLearning(base, method, fields) {
        let self = this;
        // TODO: log activity

        // get subset on which the method was used
        let subset = base.store('Subsets')[method.appliedOn];

        // create new clustering process
        let activeLearner = new ActiveLearner(base, method, subset, fields, self._formatter);
        // store and get the clustering model hash indentifier
        const hash = this._createModelStatus(activeLearner);
        const document = activeLearner.update({ hash });

        method.id = hash;
        method.currentDoc = { document, label: null };
        method.parameters.labelledDocs = [];
        // return the active learning object
        return { activeLearning: method };
    }


    updateMethodActiveLearning(method) {
        let self = this;
        // TODO: log activity

        // get the model using the method id
        let { model } = self._modelStatus[method.id];
        // get the next document to be labelled
        const document = model.update(method);
        if (model.isInitialized()) {
            method.statistics = model.getStatistics();
        }
        // update the labelled documents
        method.parameters.labelledDocs = model.params.parameters.labelledDocs;
        // setup the next current documnet to be labelled
        method.currentDoc = { document, label: null };
        // return the active learning object
        return { activeLearning: method };
    }


    deleteMethodActiveLearning(methodId) {
        let self = this;
        self._deleteModelStatus(methodId);
        return { };
    }


    _saveActiveLearning(base, createSubsetCb) {
        let self = this;
        // returns the callback function
        return function ({ methodId, fields }) {
            // get the method that was created
            let method = base.store('Methods')[methodId];
            let result = method.result;

            let subsetType = Object.keys(result);

            let subsetParams = [];
            // for each cluster calculate the aggregates
            for (let type of subsetType) {
                // get elements in the cluster
                const docIds = new qm.la.IntVector(result[type].docIds);
                const docs   = base.store('Dataset').newRecordSet(docIds);

                result[type].aggregates = [];
                // iterate through the fields
                for (let field of fields) {
                    // get aggregate distribution
                    if (field.aggregate) {
                        // get the aggregate distribution
                        let distribution = self._aggregateByField(docs, field);

                        result[type].aggregates.push({
                            field: field.name,
                            type: field.aggregate,
                            distribution
                        });
                    }
                }

                // set cluster label out of the first keyword cloud
                let label = '';
                for (let aggregate of result[type].aggregates) {
                    if (method.parameters.fields.includes(aggregate.field) && aggregate.distribution) {
                        // get the aggregates keyword distribution
                        label = aggregate.distribution.keywords.slice(0, 3)
                            .map(keyword => keyword.keyword).join(', ');
                        break;
                    }
                }

                // if label was not assigned - set a lame label
                label = `${type.toUpperCase()} - ${label}`;
                subsetParams.push({ label, type });

            }

            // store the aggregates to the method result attributes
            base.store('Methods')[methodId].result = result;

            // create all cluster subsets
            for (let subsetParam of subsetParams) {

                let { label, type } = subsetParam;
                // create subsets using the cluster information
                let subset = {
                    label: label,
                    description: null,
                    resultedIn: methodId,
                    meta: { type }
                };

                // create subset and get its id
                let { subsets: { id } } = createSubsetCb(base, subset);

                // aggregate the given subset
                self.aggregateSubset(base, id, fields);

                // join the produced subset with the method
                base.store('Methods')[methodId].$addJoin('produced', id);
            }

            return methodId;
        };
    }

    /**
     * Aggregate subset with given id.
     * @param {Object} base - The QMiner base object.
     * @param {Object} id - The subset id used to update.
     * @param {Object[]} fields - The fields in the database.
     * @returns {Object} The subset aggregates method.
     */
    aggregateSubset(base, id, fields) {
        let self = this;
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
                    let distribution = self._aggregateByField(elements, field);
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
            return self.getModel(base, methodId);

        } else {
            return { errors: { msg: `aggregateSubset: No subset with id=${id}` } };
        }
    }


    /**
     * Aggregates elements by field and type.
     * @param {RecordSet} elements - A record set of elements.
     * @param {Object} field - Object containing field name and type.
     * @returns The results of the aggregation.
     * @private
     */
    _aggregateByField(elements, field) {
        let self = this;
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
                    self._addChild(distribution, fieldVals[0], fieldVals.slice(1));
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
            if (aggregate === 'keywords' &&
                distribution &&
                distribution.keywords &&
                !distribution.keywords.length) {
                distribution.keywords.push({ keyword: elements[0][fieldName], weight: 1 });
            } else if (aggregate === 'timeline') {
                distribution.count = self._aggregateTimeline(distribution);
            }
        }
        return distribution;
    }

    _aggregateTimeline(timeline) {
        // prepare d3 libraries
        let d3 = { };
        d3 = Object.assign(d3, require('d3-time-format'));
        d3 = Object.assign(d3, require('d3-scale'));
        d3 = Object.assign(d3, require('d3-time'));


        let data = {
            days:   { values: [] },
            months: { values: [] },
            years:  { values: [] }
        };

        // year and month data container
        let year  = { date: null, value: 0 },
            month = { date: null, value: 0 };

        for (let date of timeline.date) {
            let d = new Date(date.interval);

            data.days.values.push({ date: d3.timeFormat('%Y-%m-%d')(d), value: date.frequency });

            let yearMonthDay = date.interval.split('-');
            // update years data
            if (year.date !== yearMonthDay[0]) {
                if (year.date) {
                    // add current year to the list
                    let yClone = Object.assign({}, year);
                    data.years.values.push(yClone);
                }
                year.date = d3.timeFormat('%Y')(d);
                year.value = date.frequency;
            } else {
                // update the year value
                year.value += date.frequency;
            }

            // update months data
            let yearMonth = yearMonthDay.slice(0, 2).join('-');
            if (month.date !== yearMonth) {
                if (month.date) {
                    let mClone = Object.assign({}, month);
                    data.months.values.push(mClone);
                }
                month.date = d3.timeFormat("%Y-%m")(d);
                month.value = date.frequency;
            } else {
                // update the month value
                month.value += date.frequency;
            }
        }

        // add last year and month element
        data.years.values.push(year);
        data.months.values.push(month);


        function _setInterpolation(tick) {
            let tickDate = new Date(tick);
            let tickCompare = null;
            if (aggregate === 'days') {
                tickCompare = d3.timeFormat('%Y-%m-%d')(tickDate);
            } else if (aggregate === 'months') {
                tickCompare = d3.timeFormat('%Y-%m')(tickDate);
            } else if (aggregate === 'years') {
                tickCompare = d3.timeFormat('%Y')(tickDate);
            }
            return data[aggregate].values.find(d => tickCompare === d.date) ||
                    { date: tick, value: 0 };
        }

        // interpolate through the values
        for (let aggregate of Object.keys(data)) {
            let ticks = d3.scaleTime()
                .domain(data[aggregate].values.map(d => new Date(d.date)))
                .nice().ticks(d3.timeDay);

            let interpolate = ticks.map(_setInterpolation);
            // store aggregates interpolated values
            data[aggregate].interpolate = interpolate;
            // store the maximum value
            data[aggregate].max = data[aggregate].values.map(el => el.value)
                .reduce((acc, curr) => Math.max(acc, curr), 0);
        }
        return data;
    }

    /**
     * Cluster the subset using KMeans and save results in query.
     * @param {Object} base - The QMiner base object.
     * @param {Function} createSubsetCb - How to create the subset.
     * @private
     */
    _clusteringKMeansCreateSubsets(base, hash, createSubsetCb) {
        let self = this;

        return function ({ methodId, fields }) {

            // get the method that was created by the method
            let method = base.store('Methods')[methodId];

            let result = method.result;

            let subsetParams = [ ];
            // for each cluster calculate the aggregates
            for (let clusterId = 0; clusterId < result.clusters.length; clusterId++) {

                // get elements in the cluster
                const docIds = new qm.la.IntVector(result.clusters[clusterId].docIds);
                const docs   = base.store('Dataset').newRecordSet(docIds);

                // iterate through the fields
                for (let field of fields) {
                    // get aggregate distribution
                    if (field.aggregate) {
                        // get the aggregate distribution
                        let distribution = self._aggregateByField(docs, field);

                        result.clusters[clusterId].aggregates.push({
                            field: field.name,
                            type: field.aggregate,
                            distribution
                        });
                    }
                }

                // set cluster label out of the first keyword cloud
                let label;
                for (let aggregate of result.clusters[clusterId].aggregates) {
                    if (method.parameters.fields.includes(aggregate.field) && aggregate.distribution) {

                        if (method.parameters.method.clusteringType === 'text') {
                            // get the aggregates keyword distribution
                            label = aggregate.distribution.keywords.slice(0, 3)
                                .map(keyword => keyword.keyword).join(', ');

                            break;
                        } else if (method.parameters.method.clusteringType === 'number') {
                            // get the histogram distribution
                            let min = aggregate.distribution.min;
                            let max = aggregate.distribution.max;

                            if (Math.abs(min) < 1 && min !== 0) { min = min.toFixed(2); }
                            if (Math.abs(max) < 1 && max !== 0) { max = max.toFixed(2); }

                            label = `${min} ≤ count ≤ ${max}`;
                            break;
                        }
                    }
                }

                // if label was not assigned - set a lame label
                if (!label) { label = `Cluster #${clusterId+1}`; }
                subsetParams.push({ label, clusterId });

            }

            // store the aggregates to the method result attributes
            base.store('Methods')[methodId].result = result;

            // create all cluster subsets
            for (let subsetParam of subsetParams) {

                let {label, clusterId } = subsetParam;
                // create subsets using the cluster information
                let subset = {
                    label: label,
                    description: null,
                    resultedIn: methodId,
                    meta: { clusterId }
                };

                // create subset and get its id
                let { subsets: { id } } = createSubsetCb(base, subset);

                // aggregate the given subset
                self.aggregateSubset(base, id, fields);

                // join the produced subset with the method
                base.store('Methods')[methodId].$addJoin('produced', id);
            }

            self._setModelStatus(hash, {
                status: 'finished',
                message: 'KMeans clustering finished',
                methodId
            });

        };
    }

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
    }

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
    }

    /**
     * Add the current value of the hierarchy to the children array.
     * @param {Object[]} children - The array of children.
     * @param {String} value - The current observed value in the hierarchy.
     * @param {String[]} other - Children of the value.
     * @private
     */
    _addChild(children, value, other) {
        let self = this;
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
            self._addChild(object.children, other[0], other.slice(1));

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

    /**********************************
     * Model Status functions
     *********************************/


    /**
     * @description Creates a new model status mapping.
     * @param {Object} model - The model to be mapped.
     * @returns {String} The hash under which the model was stored.
     */
    _createModelStatus(model) {
        const hash =  Math.random().toString(36).substring(2, 15) +
                      Math.random().toString(36).substring(2, 15) +
                      Date.now();
        this._modelStatus[hash] = {
            model,
            status: 'processing',
            message: 'Model is being processed'
        };
        return hash;
    }


    /**
     * @description Get the model status mapping - with possible methodId.
     * @param {String} hash - The hash under which the method was stored.
     * @returns {Object} The object containing information about the status.
     */
    getModelStatus(hash) {
        if (this._modelStatus[hash]) {
            const { status, message, methodId } = this._modelStatus[hash];
            return { status, message, methodId };
        } else {
            return {
                status: 'error',
                message: `No such process has been found for hash=${hash}`
            };
        }
    }


    /**
     * @description Set the model status mapping - with possible methodId.
     * @param {String} hash - The hash under which the method was stored.
     * @param {Object} params - The parameters used to setup.
     * @param {String} [params.status] - The status of the process.
     * @param {String} [params.message] - The message of the process.
     * @param {Number} [params.methodId] - The method id under which the model results are stored.
     */
    _setModelStatus(hash, params) {
        if (this._modelStatus[hash]) {
            // set the parameters of the status
            const { status, message, methodId } = params;
            if (status)   this._modelStatus[hash].status   = status;
            if (message)  this._modelStatus[hash].message  = message;
            if (methodId) this._modelStatus[hash].methodId = methodId;
        }
    }


    /**
     * @description Deletes the model found under the given hash.
     * @param {String} hash - The hash under which the method was stored.
     * @returns {Object} The status containing the success of the function.
     */
    _deleteModelStatus(hash) {
        if (this._modelStatus[hash]) {
            delete this._modelStatus[hash].model;
            return {
                status: 'finished',
                message: `Model has been deleted for hash=${hash}`
            };
        } else {
            return {
                status: 'error',
                message: `Nothing to delete. No model found for hash=${hash}`
            };
        }
    }
}


module.exports = ModelsManager;