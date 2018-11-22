class SubsetsManager {

    constructor(formatter, validator) {
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
     * Creates a subset record in the database.
     * @param {Object} base - The QMiner base object.
     * @param {Object} subset - The subset to store.
     * @param {String} subset.label - The label of the subset.
     * @param {String} [subset.description] - The subset description.
     * @param {Number} subset.resultedIn - The id of the method that created the subset.
     * @param {Number[]} subset.documents - Array of document ids the subset contains.
     */
    createSubset(base, subset) {
        // TODO: log activity

        let subsetId = base.store('Subsets').push({
            label:       subset.label,
            description: subset.description
        });
        let method = base.store('Methods')[subset.resultedIn];
        if (method && !method.deleted) {
            // add join to method
            base.store('Subsets')[subsetId].$addJoin('resultedIn', method);
            if (method.type === 'filter.manual') {
                subset.documents = method.result.docIds;
            }
        }

        if(subset.meta) {
            switch (method.type) {
            case 'clustering.kmeans':
                // use metadata to determine the documents in the subset
                if (!isNaN(parseFloat(subset.meta.clusterId))) {
                    // subset contains documents that were in the cluster
                    let clusterId = subset.meta.clusterId;
                    subset.documents = method.result.clusters[clusterId].docIds;
                    // update cluster information
                    let clusters = method.result.clusters;
                    clusters[clusterId].label = subset.label;
                    clusters[clusterId].subset = {
                        created: true,
                        id: subsetId,
                        deleted: false
                    };
                    method.result = { clusters };
                }
                break;
            case 'classify.active-learning':
                if (subset.meta.type) {

                    let type = subset.meta.type;
                    let result = method.result;
                    subset.documents = result[type].docIds;
                    // update the subset parameters and labels
                    result[type].label = subset.label;
                    result[type].subset = {
                        created: true,
                        id: subsetId,
                        deleted: false
                    };
                    method.result = result;
                }
                break;
            default:
                break;
            }

        }

        // add joins to documents/elements
        if (subset.documents) {
            for (let documentId of subset.documents) {
                let document = base.store('Dataset')[documentId];
                if (document) { base.store('Subsets')[subsetId].$addJoin('hasElements', document); }
            }
        }
        // return id of created subset
        return {
            subsets: {
                id: subsetId
            }
        };
    }

    /**
     * Gets information about the subsets in the database.
     * @param {Object} base - The QMiner base object.
     * @param {Number} [id] - The id of the subset.
     * @returns {Object} An array of subset representation objects.
     */
    getSubset(base, id) {
        let self = this;

        function getSubsetRelatedMethods(subset, fieldName) {
            let methods = subset[fieldName];
            if (methods && methods.length && methods[0].deleted !== undefined) {
                methods.filterByField('deleted', false);
            }
            return methods.map(method => self._formatter.method(method));
        }

        let subsets = base.store('Subsets');
        let response = { subsets: null };
        if (!isNaN(parseFloat(id))) {
            // get one subset and format it
            let subset = subsets[id];
            if (!subset || subset.deleted) { return null; }
            response.subsets = self._formatter.subset(subset);

            response.methods = [ ];
            if (subset.resultedIn) {
                // set the resulted in method
                let resultedInMethod = [self._formatter.method(subset.resultedIn)];
                response.methods = response.methods.concat(resultedInMethod);
            }
            if (subset.usedBy.length) {
                // get methods that used the subset
                let usedByMethods = getSubsetRelatedMethods(subset, 'usedBy');
                response.methods = response.methods.concat(usedByMethods);
            }
            // remove the 'methods' property if none were given
            if (!response.methods.length) { delete response.methods; }
        } else {
            let allSubsets = subsets.allRecords;
            if (allSubsets && allSubsets.length && allSubsets[0].deleted !== undefined) {
                allSubsets.filterByField('deleted', false);
            }
            response.subsets = allSubsets.map(rec => self._formatter.subset(rec));
        }
        // return the subsets
        return response;
    }

    /**
     * Creates a subset record in the database.
     * @param {Object} base - The QMiner base object.
     * @param {Object} info - The subset information.
     * @param {String} info.label - The new subset label.
     * @param {String} [info.description] - The new subset description.
     */
    updateSubset(base, info) {
        let self = this;
        // get subset info and update state
        let subset = base.store('Subsets')[info.subsetId];

        // update the subset label and description
        if (info.label) { subset.label = info.label; }
        if (info.description || info.description === null) {
            subset.description = info.description;
        }

        // return the subset information
        return { subsets: self._formatter.subset(subset) };
    }

    /**
     * Set the deleted flag for the subset and all its joins.
     * @param {Object} base - The QMiner base object.
     * @param {Number} id - The id of the subset.
     * @param {Function} deleteMethodCb - The function called to delete the associated method.
     */
    deleteSubset(base, id, deleteMethodCb) {
        let self = this;
        let subsets = base.store('Subsets');
        if (!isNaN(parseFloat(id))) {
            let subset = subsets[id];
            // if no subset or already deleted just skip
            if (!subset || subset.deleted) { return { }; }
            // set the deleted flag to true
            if (subset.deleted !== undefined && subset.deleted === false) {
                // iterate through it's joins
                for (let i = 0; i < subset.usedBy.length; i++) {
                    let method = subset.usedBy[i];
                    deleteMethodCb(base, method.$id, self.deleteSubset.bind(self));
                }
                // change parent method parameter
                if (subset.resultedIn) {
                    let parentMethod = subset.resultedIn;
                    if (parentMethod.type === 'clustering.kmeans') {
                        let clusters = parentMethod.result.clusters;
                        for (let clusterId = 0; clusterId < clusters.length; clusterId++) {
                            let cluster = clusters[clusterId];
                            if (cluster.subset.id === id) {
                                cluster.subset.deleted = true;
                                break;
                            }
                        }
                        parentMethod.result = { clusters };
                        if (!clusters.length) { parentMethod.deleted = true; }
                    } else if (parentMethod.type === 'filter.manual') {
                        parentMethod.deleted = true;
                    } else if (parentMethod.type === 'classify.active-learning') {
                        let result = parentMethod.result;
                        for (let type of Object.keys(result)) {
                            if (result[type].subset.id === id) {
                                result[type].subset.deleted = true;
                            }
                        }
                        parentMethod.result = result;
                    }
                    parentMethod.$delJoin('produced', subsets[id]);
                }

                subsets[id].deleted = true;
            }
        }
        return { };
    }

    /**
     * Gets documents that are part of the subset.
     * @param {Object} base - The QMiner base object.
     * @param {Number} id - Subset id.
     * @param {Object} [query] - Query for retrieving documents.
     * @param {Number} [query.limit=10] - The number of documents it retrieves.
     * @param {Number} [query.offset=0] - The retrieval starting point.
     * @param {Number} [query.page] - The page number based on the limit.
     * @param {Object} [query.sort] - The sort parameters.
     * @param {String} query.sort.fieldName - The field by which the sorting is done.
     * @param {String} [query.sort.sortType] - The flag specifiying is sort is done. Possible: `asc` or `desc`.
     * @param {Function} aggregateCb - Function delegating how to calculate the aggregates.
     * @returns {Object} The object containing the documents and it's metadata.
     */
    getDocuments(base, id, query, aggregateCb, fields) {
        let self = this;
        // get database subsets

        if (id < 0 || base.store('Subsets').length <= id) {
            // TODO: log error
            return { errors: { msg: 'The subset id does not match with any existing subsets' } };
        }

        // prepare the query parameters
        let offset = query.offset ? query.offset : 0;
        let limit = query.limit ? query.limit : 10;
        // if page exists, modify offset
        if (query.page) {
            offset = (query.page - 1) * limit;
        }
        // get page number - offset and limit are more reliable
        let page = Math.floor(offset/limit) + 1;

        // prepare qminer query
        let qmQuery = {
            $join: {
                $name: 'hasElements',
                $query: {
                    $from: 'Subsets',
                    $id: id
                }
            }
        };

        if (query.sort) {
            // TODO: check if sort object has expected schema
            const ascendingFlag = query.sort.sortType === 'desc' ? -1 : 1;
            const field = query.sort.field;
            // set sort to the query
            qmQuery.$sort = { };
            qmQuery.$sort[field] = ascendingFlag;
        }

        // add additional queries - keywords
        let queryParams = query.query;
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

        // prepare field metadata
        let metaFields = fields
            .map(field => {
                let sortType = null;
                // if the documents were sorted by the field
                if (query.sort && query.sort.field === field.name) {
                    sortType = query.sort.sortType;
                }
                // return field metadata
                field.sortType = sortType;
                return field;
            });

        // document aggregates
        let aggregates = [];
        if (queryParams.calculateAggregates && queryParams.calculateAggregates === 'true') {
            for (let field of fields) {
                // get aggregate distribution
                if (field.aggregate) {
                    let distribution = aggregateCb(subsetDocuments, field);
                    aggregates.push({
                        field: field.name,
                        type: field.aggregate,
                        distribution
                    });
                }
            }
        }

        // prepare objects
        let documents = {
            documents: null,
            meta: {
                fields: metaFields,
                pagination: {
                    page,
                    limit,
                    documentCount: subsetDocuments.length,
                },
                query: queryParams && queryParams.text ? queryParams : null,
                aggregates
            }
        };

        // truncate the documents and format documents
        subsetDocuments.trunc(limit, offset);
        documents.documents = subsetDocuments.map(rec => self._formatter.document(rec));
        return documents;
    }

}

module.exports = SubsetsManager;