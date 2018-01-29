// internal modules
const validator = require('../../../lib/validator')();

/**
 * Adds api routes to .
 * @param {Object} app - Express app.
 * @param {Object} pg - Postgres wrapper.
 * @param {Object} processHandler - Child process container.
 * @param {Object} sendToProcess - Function handling the process dynamic.
 */
module.exports = function (app, pg, processHandler, sendToProcess, logger) {

    /**
     * GET all methods of dataset with id=dataset_id
     */
    app.get('/api/datasets/:dataset_id/methods', (req, res) => {
        // log user request
        logger.info('user requested for all methods',
            logger.formatRequest(req)
        );

        // check if dataset_id is an integer
        let datasetId = parseInt(req.params.dataset_id);
        if (!validator.validateInteger(datasetId)) {
            // log error when datasetId is not an integer
            logger.error('error [route_parameter]: user request for all methods failed',
                logger.formatRequest(req, { error: 'Parameter dataset_id is not an integer' })
            );
            // send error object to user
            return res.send({ errors: { msg: 'Parameter dataset_id is not an integer' } });
        }

        // get the user
        let owner = req.user ? req.user.id : 'development';

        // set the body info
        let body = { cmd: 'get_method' };
        sendToProcess(datasetId, owner, body, function (error, results) {
            if (error) {
                // log error on getting subsets info
                logger.error('error [node_process]: user request for all methods failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.send({ errors: { msg: error.message } });
            }
            // log request success
            logger.info('user request for all methods successful',
                logger.formatRequest(req)
            );
            // send the data
            return res.send(results);
        });

    }); // GET /api/datasets/:dataset_id/methods

    /**
     * GET method of dataset with id=dataset_id
     */
    app.get('/api/datasets/:dataset_id/methods/:method_id', (req, res) => {
        // log user request
        logger.info('user requested for method',
            logger.formatRequest(req)
        );

        // check if dataset_id is an integer
        let datasetId = parseInt(req.params.dataset_id);
        if (!validator.validateInteger(datasetId)) {
            // log error when datasetId is not an integer
            logger.error('error [route_parameter]: user request for method failed',
                logger.formatRequest(req, { error: 'Parameter dataset_id is not an integer' })
            );
            // send error object to user
            return res.send({ errors: { msg: 'Parameter dataset_id is not an integer' } });
        }

        // check if method_id is an integer
        let methodId = parseInt(req.params.method_id);
        if (!validator.validateInteger(methodId)) {
            // log error when methodId is not an integer
            logger.error('error [route_parameter]: user request for method failed',
                logger.formatRequest(req, { error: 'Parameter method_id is not an integer' })
            );
            // send error object to user
            return res.send({ errors: { msg: 'Parameter method_id is not an integer' } });
        }

        // get the user
        let owner = req.user ? req.user.id : 'development';

        // set the body info
        let body = { cmd: 'get_method', content: { methodId } };
        sendToProcess(datasetId, owner, body, function (error, results) {
            if (error) {
                // log error on creating subset
                logger.error('error [node_process]: user request for method failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.send({ errors: { msg: error.message } });
            }
            // log request success
            logger.info('user request for method successful',
                logger.formatRequest(req)
            );
            // send the data
            return res.send(results);
        });

    }); // GET /api/datasets/:dataset_id/methods/:method_id

    /**
     * POST a new method to the database
     */
    app.post('/api/datasets/:dataset_id/methods', (req, res) => {
        // log user request
        logger.info('user requested to create new method',
            logger.formatRequest(req)
        );

        // check if dataset_id is an integer
        let datasetId = parseInt(req.params.dataset_id);
        if (!validator.validateInteger(datasetId)) {
            // log error when datasetId is not an integer
            logger.error('error [route_parameter]: user request to create new method failed',
                logger.formatRequest(req, { error: 'Parameter dataset_id is not an integer' })
            );
            // send error object to user
            return res.send({ errors: { msg: 'Parameter dataset_id is not an integer' } });
        }

        // get the user
        let owner = req.user ? req.user.id : 'development';

        // get method information
        let { method } = req.body;

        // change the method type
        method.type = method.methodType;
        delete method.methodType;

        // set the body info
        let body = { cmd: 'create_method', content: { method } };
        sendToProcess(datasetId, owner, body, function (error, results) {
            if (error) {
                // log error on creating method
                logger.error('error [node_process]: user request to create new method failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.send({ errors: { msg: error.message } });
            }
            // log request success
            logger.info('user request to create new method successful',
                logger.formatRequest(req)
            );
            // send the data
            return res.send(results);
        });

    }); // POST /api/datasets/:dataset_id/methods
};