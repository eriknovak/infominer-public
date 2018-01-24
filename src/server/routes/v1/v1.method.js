/**
 * Adds api routes to .
 * @param {Object} app - Express app.
 * @param {Object} pg - Postgres wrapper.
 * @param {Object} processHandler - Child process container.
 * @param {Object} sendToProcess - Function handling the process dynamic.
 */
module.exports = function (app, pg, processHandler, sendToProcess) {
    /**
     * Get dataset methods
     */
    app.get('/api/datasets/:dataset_id/methods', (req, res) => {

        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        // get the user
        let owner = req.user ? req.user.id : 'user';

        // set the body info
        let body = { cmd: 'get_method' };
        sendToProcess(datasetId, owner, body, function (error, results) {
            // if error notify user
            if (error) {
                // TODO: log error
                console.log('GET datasets/:datasets_id/methods', error.message);
                return res.send({ errors: { msg: error.message } });
            }
            return res.send(results);
        });

    }); // GET /api/datasets/:dataset_id/methods

    /**
     * get subset info of dataset with id=dataset_id and subset_id=subset_id
     */
    app.get('/api/datasets/:dataset_id/methods/:method_id', (req, res) => {

        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        let methodId = parseInt(req.params.method_id);

        // get the user
        let owner = req.user ? req.user.id : 'user';

        // set the body info
        let body = { cmd: 'get_method', content: { methodId } };
        sendToProcess(datasetId, owner, body, function (error, results) {
            // if error notify user
            if (error) {
                // TODO: log error
                console.log('GET datasets/:datasets_id/methods/:method_id', error.message);
                return res.send({ errors: { msg: error.message } });
            }
            return res.send(results);
        });

    }); // GET /api/datasets/:dataset_id/methods/:method_id

    /**
     * POST a new method to the database
     */
    app.post('/api/datasets/:dataset_id/methods', (req, res) => {
        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        // get the user
        let owner = req.user ? req.user.id : 'user';

        let { method } = req.body;

        // change the method type
        method.type = method.methodType;
        delete method.methodType;

        // set the body info
        let body = { cmd: 'create_method', content: { method } };
        sendToProcess(datasetId, owner, body, function (error, results) {
            // if error notify user
            if (error) {
                // TODO: log error
                console.log('POST datasets/:datasets_id/methods', error.message);
                return res.send({ errors: { msg: error.message } });
            }
            return res.send(results);
        });

    }); // POST /api/datasets/:dataset_id/methods
};