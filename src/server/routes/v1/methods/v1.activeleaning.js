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
     * GET subset of dataset with id=dataset_id
     */
    app.get('/api/datasets/:dataset_id/subsets/:subset_id/active_learning', (req, res) => {
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
            return res.status(500).json({ errors: { msg: 'Parameter dataset_id is not an integer' } });
        }

        // check if subset_id is an integer
        let subsetId = parseInt(req.params.subset_id);
        if (!validator.validateInteger(subsetId)) {
            // log error when subsetId is not an integer
            logger.error('error [route_parameter]: user request for subset failed',
                logger.formatRequest(req, { error: 'Parameter subset_id is not an integer' })
            );
            // send error object to user
            return res.status(500).json({ errors: { msg: 'Parameter subset_id is not an integer' } });
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
                return res.status(500).json({ errors: { msg: error.message } });
            }
            // log request success
            logger.info('user request for subset successful',
                logger.formatRequest(req)
            );
            // send the data
            return res.json(results);
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
            return res.status(500).json({ errors: { msg: 'Parameter dataset_id is not an integer' } });
        }

        // check if subset_id is an integer
        let subsetId = parseInt(req.params.subset_id);
        if (!validator.validateInteger(subsetId)) {
            // log error when subsetId is not an integer
            logger.error('error [route_parameter]: user request to update subset failed',
                logger.formatRequest(req, { error: 'Parameter subset_id is not an integer' })
            );
            // send error object to user
            return res.status(500).json({ errors: { msg: 'Parameter subset_id is not an integer' } });
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
                return res.status(500).json({ errors: { msg: error.message } });
            }
            // log request success
            logger.info('user request to update subset successful',
                logger.formatRequest(req)
            );
            // send the data
            return res.json(results);
        });
    }); // PUT /api/datasets/:dataset_id/subsets/:subset_id

    app.delete('/api/datasets/:dataset_id/subsets/:subset_id', (req, res) => {
        // log user requests
        logger.info('user requested to delete subset',
            logger.formatRequest(req)
        );

        let datasetId = parseInt(req.params.dataset_id);
        if (!validator.validateInteger(datasetId)) {
            // log error when datasetId is not an integer
            logger.error('error [route_parameter]: user request to delete subset failed',
                logger.formatRequest(req, { error: 'Parameter dataset_id is not an integer' })
            );
            // send error object to user
            return res.status(500).json({ errors: { msg: 'Parameter dataset_id is not an integer' } });
        }

        let subsetId = parseInt(req.params.subset_id);
        if (!validator.validateInteger(subsetId)) {
            // log error when subsetId is not an integer
            logger.error('error [route_parameter]: user request to delete subset failed',
                logger.formatRequest(req, { error: 'Parameter subset_id is not an integer' })
            );
            // send error object to user
            return res.status(500).json({ errors: { msg: 'Parameter subset_id is not an integer' } });
        }
        // the user making the request
        let owner = req.user ? req.user.id : 'development';

        // send the request to the process
        let body = { cmd: 'delete_subset', content: { subsetId } };
        sendToProcess(datasetId, owner, body, function (error, results) {
            if (error) {
                // log error on updating subset
                logger.error('error [node_process]: user request to delete subset failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.status(500).json({ errors: { msg: error.message } });
            }
            // log request success
            logger.info('user request to delete subset successful',
                logger.formatRequest(req)
            );
            // send the data
            return res.json(results);
        });
    });

};
