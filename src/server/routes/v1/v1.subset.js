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
     * GET all subsets of dataset with id=dataset_id
     */
    app.get('/api/datasets/:dataset_id/subsets', (req, res) => {
        // log user request
        logger.info('user requested for all subsets',
            logger.formatRequest(req)
        );

        // check if dataset_id is an integer
        let datasetId = parseInt(req.params.dataset_id);
        if (!validator.validateInteger(datasetId)) {
            // log error when datasetId is not an integer
            logger.error('error [route_parameter]: user request for all subsets failed',
                logger.formatRequest(req, { error: 'Parameter dataset_id is not an integer' })
            );
            // send error object to user
            return res.send({ errors: { msg: 'Parameter dataset_id is not an integer' } });
        }

        // get the user
        let owner = req.user ? req.user.id : 'development';

        // set the body info
        let body = { cmd: 'get_subset' };
        sendToProcess(datasetId, owner, body, function (error, results) {
            if (error) {
                // log error on getting subsets
                logger.error('error [node_process]: user request for all subsets failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.send({ errors: { msg: error.message } });
            }
            // log request success
            logger.info('user request for all subsets successful',
                logger.formatRequest(req)
            );
            // send the data
            return res.send(results);
        });
    }); // GET /api/datasets/:dataset_id/subsets

    /**
     * POST a new subset to the databse
     */
    app.post('/api/datasets/:dataset_id/subsets', (req, res) => {
        // log user request
        logger.info('user requested to create new subset',
            logger.formatRequest(req)
        );

        // check if dataset_id is an integer
        let datasetId = parseInt(req.params.dataset_id);
        if (!validator.validateInteger(datasetId)) {
            // log error when datasetId is not an integer
            logger.error('error [route_parameter]: user request to create new subset failed',
                logger.formatRequest(req, { error: 'Parameter dataset_id is not an integer' })
            );
            // send error object to user
            return res.send({ errors: { msg: 'Parameter dataset_id is not an integer' } });
        }

        // get the user
        let owner = req.user ? req.user.id : 'development';
        // get data about the new subset
        const { subset } = req.body;

        // set the body info
        let body = { cmd: 'create_subset', content: { subset } };
        sendToProcess(datasetId, owner, body, function (error, results) {
            if (error) {
                // log error on creating subset
                logger.error('error [node_process]: user request to create new subset failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.send({ errors: { msg: error.message } });
            }
            // log request success
            logger.info('user request to create new subset successful',
                logger.formatRequest(req)
            );
            // send the data
            return res.send(results);
        });
    }); // POST /api/datasets/:dataset_id/subsets

    /**
     * GET subset of dataset with id=dataset_id
     */
    app.get('/api/datasets/:dataset_id/subsets/:subset_id', (req, res) => {
        // log user request
        logger.info('user requested for subset',
            logger.formatRequest(req)
        );

        // check if dataset_id is an integer
        let datasetId = parseInt(req.params.dataset_id);
        if (!validator.validateInteger(datasetId)) {
            // log error when datasetId is not an integer
            logger.error('error [route_parameter]: user request for subset failed',
                logger.formatRequest(req, { error: 'Parameter dataset_id is not an integer' })
            );
            // send error object to user
            return res.send({ errors: { msg: 'Parameter dataset_id is not an integer' } });
        }

        // check if subset_id is an integer
        let subsetId = parseInt(req.params.subset_id);
        if (!validator.validateInteger(subsetId)) {
            // log error when subsetId is not an integer
            logger.error('error [route_parameter]: user request for subset failed',
                logger.formatRequest(req, { error: 'Parameter subset_id is not an integer' })
            );
            // send error object to user
            return res.send({ errors: { msg: 'Parameter subset_id is not an integer' } });
        }

        // get the user
        let owner = req.user ? req.user.id : 'development';
        // set the body info
        let body = { cmd: 'get_subset', content: { subsetId } };
        sendToProcess(datasetId, owner, body, function (error, results) {
            if (error) {
                // log error on getting subset
                logger.error('error [node_process]: user request for subset failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.send({ errors: { msg: error.message } });
            }
            // log request success
            logger.info('user request for subset successful',
                logger.formatRequest(req)
            );
            // send the data
            return res.send(results);
        });
    }); // GET /api/datasets/:dataset_id/subsets/:subset_id

    /**
     * PUT subset of dataset with id=dataset_id
     */
    app.put('/api/datasets/:dataset_id/subsets/:subset_id', (req, res) => {
        // log user request
        logger.info('user requested to update subset',
            logger.formatRequest(req)
        );

        // check if dataset_id is an integer
        let datasetId = parseInt(req.params.dataset_id);
        if (!validator.validateInteger(datasetId)) {
            // log error when datasetId is not an integer
            logger.error('error [route_parameter]: user request to update subset failed',
                logger.formatRequest(req, { error: 'Parameter dataset_id is not an integer' })
            );
            // send error object to user
            return res.send({ errors: { msg: 'Parameter dataset_id is not an integer' } });
        }

        // check if subset_id is an integer
        let subsetId = parseInt(req.params.subset_id);
        if (!validator.validateInteger(subsetId)) {
            // log error when subsetId is not an integer
            logger.error('error [route_parameter]: user request to update subset failed',
                logger.formatRequest(req, { error: 'Parameter subset_id is not an integer' })
            );
            // send error object to user
            return res.send({ errors: { msg: 'Parameter subset_id is not an integer' } });
        }

        // get the user
        let owner = req.user ? req.user.id : 'development';

        // get dataset information
        let subset = req.body.subset;
        let label = subset.label;
        let description = subset.description;

        // set the body info
        let body = { cmd: 'edit_subset', content: { subsetId, label, description } };
        sendToProcess(datasetId, owner, body, function (error, results) {
            if (error) {
                // log error on updating subset
                logger.error('error [node_process]: user request to update subset failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.send({ errors: { msg: error.message } });
            }
            // log request success
            logger.info('user request to update subset successful',
                logger.formatRequest(req)
            );
            // send the data
            return res.send(results);
        });
    }); // PUT /api/datasets/:dataset_id/subsets/:subset_id

    /**
     * GET subset documents
     */
    app.get('/api/datasets/:dataset_id/subsets/:subset_id/documents', (req, res) => {
        // log user request
        logger.info('user requested for documents in subset',
            logger.formatRequest(req)
        );

        // check if dataset_id is an integer
        let datasetId = parseInt(req.params.dataset_id);
        if (!validator.validateInteger(datasetId)) {
            // log error when datasetId is not an integer
            logger.error('error [route_parameter]: user request for documents in subset failed',
                logger.formatRequest(req, { error: 'Parameter dataset_id is not an integer' })
            );
            // send error object to user
            return res.send({ errors: { msg: 'Parameter dataset_id is not an integer' } });
        }

        // check if subset_id is an integer
        let subsetId = parseInt(req.params.subset_id);
        if (!validator.validateInteger(subsetId)) {
            // log error when subsetId is not an integer
            logger.error('error [route_parameter]: user request for documents in subset failed',
                logger.formatRequest(req, { error: 'Parameter subset_id is not an integer' })
            );
            // send error object to user
            return res.send({ errors: { msg: 'Parameter subset_id is not an integer' } });
        }

        // query values
        let query = {
            offset: parseInt(req.query.offset),
            limit: parseInt(req.query.limit),
            page: parseInt(req.query.page),
            sort: req.query.sort,
            query: req.query.query
        };

        console.log(req.query);

        // get the user
        let owner = req.user ? req.user.id : 'development';

        // set the body info
        let body = { cmd: 'get_subset_documents', content: { subsetId, query } };
        sendToProcess(datasetId, owner, body, function (error, results) {
            // if error notify user
            if (error) {
                // log error on getting subset documents
                logger.error('error [node_process]: user request for documents in subset failed',
                    logger.formatRequest(req, { error: error.message })
                );
                return res.send({ errors: { msg: error.message } });
            }
            // log request success
            logger.info('user request for documents in subset successful',
                logger.formatRequest(req)
            );
            // send the data
            return res.send(results);
        });
    }); // GET /api/datasets/:dataset_id/subsets/:subset_id/documents
};