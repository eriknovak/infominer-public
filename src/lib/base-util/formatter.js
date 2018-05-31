module.exports = {

    /**
     * Formats the subset record.
     * @param {Object} record - The subset record.
     * @returns {Object} The subset json representation.
     */
    subset(record) {
        return {
            id: record.$id,
            type: 'subsets',
            label: record.label,
            description: record.description,
            resultedIn: record.resultedIn ? record.resultedIn.$id : null,
            usedBy: !record.usedBy.empty ? record.usedBy.map(method => method.$id) : null,
            documentCount: !record.hasElements.empty ? record.hasElements.length : null
        };
    },

    /**
     * Formats the document record.
     * @param {Object} record - The document record.
     * @returns {Object} The document json representation.
     * @private
     */
    document(record) {
        return {
            id: record.$id,
            type: 'documents',
            subsets: !record.inSubsets.empty ? record.inSubsets.map(subset => subset.$id) : null,
            values: record.toJSON(false, false, false)
        };
    },

    /**
     * Formats the method record.
     * @param {Object} record - The method record.
     * @returns {Object} The method json representation.
     * @private
     */
    method(record) {
        return {
            id: record.$id,
            type: 'methods',
            methodType: record.type,
            parameters: record.parameters,
            result: this._methodResults(record.type, record.result),
            produced: !record.produced.empty ? record.produced.map(subset => subset.$id) : null,
            appliedOn: !record.appliedOn.empty ? record.appliedOn.map(subset => subset.$id) : null
        };
    },

    /**********************************
     * Method subformat functions
     */

    /**
     * Formats the method results.
     * @param {String} type - The method type.
     * @param {Object} result - The results saved in the method.
     * @returns {Object} The formated method results.
     * @private
     */
    _methodResults(type, result) {
        switch(type) {
        case 'clustering.kmeans':
            return this._kMeansClustering(result);
        default:
            return result;
        }
    },

    /**
     * Formats the KMeans results.
     * @param {Object} result - The KMeans results.
     * @returns {Object} The formated results.
     * @private
     */
    _kMeansClustering(result) {
        return {
            clusters: result.clusters.map(cluster => ({
                documentCount: cluster.docIds.length,
                aggregates: cluster.aggregates,
                subset: cluster.subset,
                label: cluster.label
            }))
        };
    }

};