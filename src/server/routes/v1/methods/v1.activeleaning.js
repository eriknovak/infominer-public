// internal modules
const validator = require('../../../../lib/validator')();

/**
 * Adds api routes to .
 * @param {Object} app - Express app.
 * @param {Object} pg - Postgres wrapper.
 * @param {Object} processHandler - Child process container.
 * @param {Object} sendToProcess - Function handling the process dynamic.
 */
module.exports = function (app, pg, processHandler, sendToProcess, logger) {

    /**
     * POST active learning with id=dataset_id
     */
    app.post('/api/datasets/:dataset_id/methods/active-learning', (req, res) => {
        // log user request
        logger.info('user requested for active-learning',
            logger.formatRequest(req)
        );

        // check if dataset_id is an integer
        let datasetId = parseInt(req.params.dataset_id);
        if (!validator.validateInteger(datasetId)) {
            // log error when datasetId is not an integer
            logger.error('error [route_parameter]: user request for active-learning failed',
                logger.formatRequest(req, { error: 'Parameter dataset_id is not an integer' })
            );
            // send error object to user
            return res.status(500).json({ errors: { msg: 'Parameter dataset_id is not an integer' } });
        }

        // get the parameters of new active-learning method
        let method = req.body.activeLearning;
        method.type = method.methodType;
        delete method.methodType;

        // get the user
        let owner = req.user ? req.user.id : 'development';
        // set the body info
        let body = { cmd: 'create_method_active_learning', content: { method } };
        sendToProcess(datasetId, owner, body, function (error, results) {
            if (error) {
                // log error on getting subset
                logger.error('error [node_process]: user request for active-learning failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.status(500).json({ errors: { msg: error.message } });
            }
            // log request success
            logger.info('user request for active-learning successful',
                logger.formatRequest(req)
            );
            // send the data
            return res.json(results);
        });
    }); // POST /api/datasets/:dataset_id/methods/active-learning

    /**
     * PUT active learning with id=dataset_id
     */
    app.put('/api/datasets/:dataset_id/methods/active-learning/:hash', (req, res) => {
        // log user request
        logger.info('user requested to update active learning',
            logger.formatRequest(req)
        );

        // check if dataset_id is an integer
        let datasetId = parseInt(req.params.dataset_id);
        if (!validator.validateInteger(datasetId)) {
            // log error when datasetId is not an integer
            logger.error('error [route_parameter]: user request to update active learning failed',
                logger.formatRequest(req, { error: 'Parameter dataset_id is not an integer' })
            );
            // send error object to user
            return res.status(500).json({ errors: { msg: 'Parameter dataset_id is not an integer' } });
        }

        // get the user
        let owner = req.user ? req.user.id : 'development';

        // get the parameters of existing active-learning method
        let method = req.body.activeLearning;
        method.id = req.params.hash;
        method.type = method.methodType;
        delete method.methodType;

        // set the body info
        let body = { cmd: 'update_method_active_learning', content: { method } };
        sendToProcess(datasetId, owner, body, function (error, results) {
            if (error) {
                // log error on updating subset
                logger.error('error [node_process]: user request to update active learning failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.status(500).json({ errors: { msg: error.message } });
            }
            // log request success
            logger.info('user request to update active learning successful',
                logger.formatRequest(req)
            );
            // send the data
            return res.json(results);
        });
    }); // PUT /api/datasets/:dataset_id/methods/active-learning/:hash

    /**
     * DELETE active learning with id=dataset_id
     */
    app.delete('/api/datasets/:dataset_id/methods/active-learning/:hash', (req, res) => {
        // log user request
        logger.info('user requested to delete active learning',
            logger.formatRequest(req)
        );

        // check if dataset_id is an integer
        let datasetId = parseInt(req.params.dataset_id);
        if (!validator.validateInteger(datasetId)) {
            // log error when datasetId is not an integer
            logger.error('error [route_parameter]: user request to delete active learning failed',
                logger.formatRequest(req, { error: 'Parameter dataset_id is not an integer' })
            );
            // send error object to user
            return res.status(500).json({ errors: { msg: 'Parameter dataset_id is not an integer' } });
        }

        // get the user
        let owner = req.user ? req.user.id : 'development';

        // get the id of existing active-learning method
        let methodId = req.params.hash;

        // set the body info
        let body = { cmd: 'delete_method_active_learning', content: { methodId } };
        sendToProcess(datasetId, owner, body, function (error, results) {
            if (error) {
                // log error on updating subset
                logger.error('error [node_process]: user request to delete active learning failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.status(500).json({ errors: { msg: error.message } });
            }
            // log request success
            logger.info('user request to delete active learning successful',
                logger.formatRequest(req)
            );
            // send the data
            return res.json(results);
        });
    }); // DELETE /api/datasets/:dataset_id/methods/active-learning/:hash

};
