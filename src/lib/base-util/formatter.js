function undeletedRecords(record, field) {
    let recordSet = record[field];
    if (recordSet[0].deleted === undefined) {
        // get all record ids
        return recordSet.map(rec => rec.$id);
    }
    recordSet.filterByField('deleted', false);
    return recordSet.length ? recordSet.map(rec => rec.$id) : null;
}

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
            usedBy: !record.usedBy.empty ? undeletedRecords(record, 'usedBy') : null,
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
            subsets: !record.inSubsets.empty ? undeletedRecords(record, 'inSubsets') : null,
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
            produced: !record.produced.empty ? undeletedRecords(record, 'produced') : null,
            appliedOn: !record.appliedOn.empty ? undeletedRecords(record, 'appliedOn') : null
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
                documentSample: cluster.documentSample,
                aggregates: cluster.aggregates,
                subset: cluster.subset,
                label: cluster.label
            }))
        };
    }

};