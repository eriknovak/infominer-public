// internal modules
const messageHandler = require('../../../lib/messageHandler');

/**
 * Adds api routes to .
 * @param {Object} app - Express app.
 * @param {Object} pg - Postgres wrapper.
 * @param {Object} processHandler - Child process container.
 * @param {Object} sendToProcess - Function handling the process dynamic.
 */
module.exports = function (app, pg, processHandler, sendToProcess) {
    /**
     * get ALL subsets info of dataset with id=dataset_id
     */
    app.get('/api/datasets/:dataset_id/subsets', (req, res) => {

        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        // get the user
        let owner = req.user ? req.user.id : 'user';

        // set the body info
        let body = { cmd: 'get_subset_info' };
        sendToProcess(datasetId, owner, body, function (error, results) {
            // if error notify user
            if (error) {
                // TODO: log error
                console.log('GET datasets/:datasets_id/subsets', error.message);
                return res.send({ errors: { msg: error.message } });
            }
            let obj = messageHandler.onInfo(results);
            return res.send(obj);
        });
    }); // GET /api/datasets/:dataset_id/subsets

    /**
     * POST a new subset to the databse
     */
    app.post('/api/datasets/:dataset_id/subsets', (req, res) => {
        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        // get the user
        let owner = req.user ? req.user.id : 'user';

        const { subset } = req.body;

        // set the body info
        let body = { cmd: 'create_subset', content: { subset } };
        sendToProcess(datasetId, owner, body, function (error, results) {
            // if error notify user
            if (error) {
                // TODO: log error
                console.log('POST datasets/:datasets_id/subsets', error.message);
                return res.send({ errors: { msg: error.message } });
            }
            let obj = messageHandler.onInfo(results);
            return res.send(obj);
        });
    }); // POST /api/datasets/:dataset_id/subsets

    /**
     * get subset info of dataset with id=dataset_id and subset_id=subset_id
     */
    app.get('/api/datasets/:dataset_id/subsets/:subset_id', (req, res) => {

        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        let subsetId = parseInt(req.params.subset_id);

        // get the user
        let owner = req.user ? req.user.id : 'user';
        // set the body info
        let body = { cmd: 'get_subset_info', content: { subsetId } };
        sendToProcess(datasetId, owner, body, function (error, results) {
            // if error notify user
            if (error) {
                // TODO: log error
                console.log('GET datasets/:datasets_id/subsets/:subset_id', error.message);
                return res.send({ errors: { msg: error.message } });
            }
            let obj = messageHandler.onInfo(results);
            return res.send(obj);
        });
    }); // GET /api/datasets/:dataset_id/subsets/:subset_id

    /**
     * get subset info of dataset with id=dataset_id and subset_id=subset_id
     */
    app.put('/api/datasets/:dataset_id/subsets/:subset_id', (req, res) => {

        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        let subsetId = parseInt(req.params.subset_id);

        // get the user
        let owner = req.user ? req.user.id : 'user';

        // get dataset information
        // TODO: check schema structure
        let subset = req.body.subset;
        let label = subset.label;
        let description = subset.description;

        // set the body info
        let body = { cmd: 'edit_subset', content: { subsetId, label, description } };
        sendToProcess(datasetId, owner, body, function (error, results) {
            // if error notify user
            if (error) {
                // TODO: log error
                console.log('PUT datasets/:datasets_id/subsets/:subset_id', error.message);
                return res.send({ errors: { msg: error.message } });
            }
            let obj = messageHandler.onInfo(results);
            return res.send(obj);
        });
    }); // PUT /api/datasets/:dataset_id/subsets/:subset_id

    /**
     * Gets the subset documents
     */
    app.get('/api/datasets/:dataset_id/subsets/:subset_id/documents', (req, res) => {

        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        let subsetId = parseInt(req.params.subset_id);

        // query values
        // TODO: check if query contains offset, limit or page
        let query = {
            offset: parseInt(req.query.offset),
            limit: parseInt(req.query.limit),
            page: parseInt(req.query.page),
            sort: req.query.sort
        };

        // get the user
        let owner = req.user ? req.user.id : 'user';

        // set the body info
        let body = { cmd: 'subset_documents_info', content: { subsetId, query } };
        sendToProcess(datasetId, owner, body, function (error, results) {
            // if error notify user
            if (error) {
                // TODO: log error
                console.log('GET datasets/:datasets_id/subsets/:subset_id/documents', error.message);
                return res.send({ errors: { msg: error.message } });
            }
            let obj = messageHandler.onInfo(results);
            return res.send(obj);
        });
    }); // GET /api/datasets/:dataset_id/subsets/:subset_id/documents
};