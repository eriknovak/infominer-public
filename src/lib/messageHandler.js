/**
 * Contains handlers for different types of messages.
 */

module.exports = {
    /**
     * Creates response for message type 'create'.
     * @param {Object} results - The results of the message.
     * @param {Object} results.datasetId - The id associated to the database in the child process.
     * @returns {Object} The object sent to the response.
     */
    onCreate: function (results) {
        // TODO: check json schema
        let { datasetId } = results;
        return { id: datasetId };
    },

    /**
     *
     */
    onOpen: function (results) {
        // TODO: check json schema
        let { datasetId } = results;
        return { id: datasetId };
    },

    onInfo: function (results) {
        // todo: check json schema
        let { jsonResults } = results;
        return jsonResults;
    },

    /**
     * Checks message body structure.
     * @param {Object} body - The message body.
     * @returns {Boolean} True if body structured correct. Otherwise false.
     */
    checkJsonShema: function (body) {
        // TODO: implement check json schmea for body
    }
};