/**
 * Adds api routes to express  app.
 * @param {Object} app - Express app.
 * @param {Object} pg - Postgres wrapper.
 * @param {Object} processHandler - Child process container.
 * @param {Object} logger - The logger object.
 */
module.exports = function (app, pg, processHandler, logger) {

    /////////////////////////////////////////////////////////////////////
    // Functions used for sending messages to child processes
    /////////////////////////////////////////////////////////////////////

    /**
     * Sends a message to the child process.
     * @param {Number} childId - The child process id.
     * @param {String} owner - The owner of the dataset.
     * @param {Object} msg - The message content.
     * @param {Function} callback - The function executed at the end.
     */
    function sendToProcess(childId, owner, msg, callback) {
        let sendMessage = function (error) {
            if (error) { return callback(error); }
            processHandler.sendAndWait(childId, msg, callback);
        };

        if (processHandler.childExist(childId)) {
            // send the request to the process
            sendMessage();
        } else {
            // opens
            _openProcess(childId, owner, sendMessage);
        }
    }

    /**
     * Sends a message to the child process.
     * @param {Number} childId - The child process id.
     * @param {String} owner - The owner of the dataset.
     * @param {Function} callback - The function executed at the end.
     * @private
     */
    function _openProcess(childId, owner, callback) {
        // get the dataset information
        pg.select({ id: childId, owner }, 'infominer_datasets', (error, results) => {
            if (error) {
                // exit - error occured in postgres
                return callback(error);
            } else if (results.length !== 1) {
                // exit - more or none results have been found
                return callback(new Error('Multiple or none results found: ' + results.length));
            }
            let datasetInfo = results[0];
            // initiate child process
            processHandler.createChild(childId);
            // open dataset in child process
            let openParams = {
                cmd: 'open_dataset',
                content: {
                    params: {
                        datasetId: childId,
                        label: datasetInfo.label,
                        description: datasetInfo.description,
                        created: datasetInfo.created,
                        mode: 'open',
                        dbPath: datasetInfo.dbpath
                    }
                }
            };
            processHandler.sendAndWait(childId, openParams, function (xerror) {
                if (xerror) { return callback(xerror); }
                return callback();
            });
        });
    }

    /////////////////////////////////////////////////////////////////////
    // API Routes
    /////////////////////////////////////////////////////////////////////

    require('./v1/v1.dataset')(app, pg, processHandler, sendToProcess, logger);
    require('./v1/v1.subset') (app, pg, processHandler, sendToProcess, logger);
    require('./v1/v1.method') (app, pg, processHandler, sendToProcess, logger);

};