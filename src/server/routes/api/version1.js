// external modules
const multer = require('multer');   // accepting files from client
const stream = require('stream');   // create stream from file buffer
const fs = require('fs');
// internal modules
const fileManager = require('../../../lib/fileManager');
const messageHandler = require('../../../lib/messageHandler');

// configurations
const static = require('../../../config/static');

// parameter values
let upload = multer();   // used for uploading files

/**
 * Adds api routes to express  app.
 * @param {Object} app - Express app.
 * @param {Object} pg - Postgres wrapper.
 * @param {Object} processHandler - Child process container.
 */
module.exports = function (app, pg, processHandler) {

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
        let sendMessage = function (err) {
            if (err) { return callback(err); }
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
        // get the
        pg.select({ id: childId, owner }, 'datasets', (err, results) => {
            if (err) {
                // TODO: log error
                console.error(err.message);
                return callback(err);
            } else if (results.length === 1) {
                let datasetInfo = results[0];
                // initiate child process
                processHandler.createChild(childId);
                // open dataset in child process
                let openParams = {
                    cmd: 'open',
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
                processHandler.sendAndWait(childId, openParams, function (xerr) {
                    if (xerr) { return callback(xerr); }
                    callback();
                });

            }
        });
    }

    /////////////////////////////////////////////////////////////////////
    // Routes of the api
    /////////////////////////////////////////////////////////////////////

    /**
     * gets all user defined datasets
     */
    app.get('/api/datasets', (req, res) => {
        // TODO: log calling this route
        // query parameters
        let query = req.query;
        // TODO: get username of creator and handle empty user
        // TODO: get user from the login parameters (passport.js - future work)
        const owner = query.user || 'user';
        // get user datasets
        pg.select({ owner }, 'datasets', (err, results) => {
            if (err) {
                return res.send({ errors: { msg: err.message } });
            }
            // create JSON API data
            let datasets = results.map(rec => {
                return {
                    id: rec.id,
                    type: 'dataset',
                    label: rec.label,
                    created: rec.created
                };
            });
            // return the data
            return res.send({ datasets });
        }); // pg.select({ owner })
    }); // GET /api/datasets


    /**
     * posts file and creates a new dataset
     * TODO: ensure handling large datasets
     */
    app.post('/api/datasets/new', upload.single('file'), (req, res) => {
        // TODO: log calling this route
        // get dataset info
        let { dataset, fields } = req.body;
        let file = req.file;

        // parse the JSON values from the body
        // TODO: handle exceptions
        dataset = JSON.parse(dataset);
        fields = JSON.parse(fields);

        // TODO: get username of creator
        const owner = 'user'; // temporary placeholder

        // get number of datasets the users already has
        pg.select({ owner }, 'datasets', (err, results) => {
            if (err) {
                // TODO: handle error
                console.log(err); return;
            }
            // number of datasets is the name of the new dataset folder
            const dbFolder = results.length ? results[results.length-1].id : 0;

            // set pg dataset values
            const label = dataset.label;                                // the user defined dataset label
            const description = dataset.description;                    // the description of the dataset
            const dbPath = `${static.dataPath}\\${owner}\\${dbFolder}`; // dataset directory

            // create dataset directory
            fileManager.createDirectoryPath(dbPath);

            // create write stream in dataset folder
            let filePath = `${dbPath}/originalSource.txt`;
            let writeStream = fs.createWriteStream(filePath);

            // save file in corresponding dataset folder
            let bufferStream = new stream.PassThrough();
            bufferStream.end(file.buffer);
            // pipe buffer stream to write file
            bufferStream.pipe(writeStream)
                .on('finish', () => {
                    // TODO: log completion
                    // save the metadata to postgres
                    pg.insert({ owner, label, description, dbPath }, 'datasets', (xerr, results) => {
                        // if error notify user
                        if (xerr) {
                            // TODO: log error
                            console.log(xerr.message);
                            return res.send({ errors: { msg: xerr.message } }); }

                        // initiate child process
                        let datasetInfo = results[0];
                        let datasetId = parseInt(datasetInfo.id);
                        processHandler.createChild(datasetId);

                        // prepare message body
                        dataset.label = label; // set the label of the dataset
                        // body of the message
                        let body = {
                            cmd: 'create',
                            content: {
                                fields,
                                filePath,
                                params: {
                                    datasetId,
                                    label,
                                    description,
                                    created: datasetInfo.created,
                                    mode: 'createClean',
                                    dbPath
                                }
                            }
                        };

                        processHandler.sendAndWait(datasetId, body, function (error, results) {
                            // if error notify user
                            if (error) { return res.send({ errors: { msg: error.message } }); }
                            // otherwise return results
                            let obj = messageHandler.onCreate(results);
                            return res.send(obj);
                        });

                    });
                }); // bufferStream.on('finish')
        }); // pg.select({ owner })
    }); // POST /api/dataset/new


    /**
     * get dataset info of dataset with id=dataset_id
     */
    app.get('/api/datasets/:dataset_id', (req, res) => {
        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        // get the user
        let owner = req.user || 'user';

        let body = { cmd: 'dataset_info' };
        sendToProcess(datasetId, owner, body, function (error, results) {
            // if error notify user
            if (error) {
                // TODO: log error
                console.log(error.message);
                return res.send({ errors: { msg: error.message } });
            }
            let obj = messageHandler.onInfo(results);
            return res.send(obj);
        });
    }); // GET /api/datasets/:dataset_id

    /**
     * get dataset info of dataset with id=dataset_id
     */
    app.delete('/api/datasets/:dataset_id', (req, res) => {
        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        // get the user
        let owner = req.user || 'user';

        let body = { cmd: 'shutdown' };
        sendToProcess(datasetId, owner, body, function (error, results) {
            // if error notify user
            if (error) {
                // TODO: log error
                console.log(error.message);
                return res.send({ errors: { msg: error.message } });
            }

            pg.delete({ id: datasetId, owner }, 'datasets', (err, xresults) => {
                // TODO: delete dataset
                let datasetDbPath = results.dbPath;
                if (datasetDbPath) { fileManager.removeFolder(datasetDbPath); }
                console.log('End deleting');
                return res.send({});
            });

        }); // sendToProcess
    }); // GET /api/datasets/:dataset_id


    /**
     * get ALL subsets info of dataset with id=dataset_id
     */
    app.get('/api/datasets/:dataset_id/subsets', (req, res) => {
        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        // get the user
        let owner = req.user || 'user';

        // set the body info
        let body = { cmd: 'subset_info' };
        sendToProcess(datasetId, owner, body, function (error, results) {
            // if error notify user
            if (error) {
                // TODO: log error
                console.log(error.message);
                return res.send({ errors: { msg: error.message } });
            }
            let obj = messageHandler.onInfo(results);
            return res.send(obj);
        });
    });


    /**
     * get subset info of dataset with id=dataset_id and subset_id=subset_id
     */
    app.get('/api/datasets/:dataset_id/subsets/:subset_id', (req, res) => {

        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        let subsetId = parseInt(req.params.subset_id);

        // get the user
        let owner = req.user || 'user';

        // set the body info
        let body = { cmd: 'subset_info', content: { subsetId } };
        sendToProcess(datasetId, owner, body, function (error, results) {
            // if error notify user
            if (error) {
                // TODO: log error
                console.log(error.message);
                return res.send({ errors: { msg: error.message } });
            }
            let obj = messageHandler.onInfo(results);
            return res.send(obj);
        });
    });


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
            page: parseInt(req.query.page)
        };

        // get the user
        let owner = req.user || 'user';

        // set the body info
        let body = { cmd: 'subset_documents_info', content: { subsetId, query } };
        sendToProcess(datasetId, owner, body, function (error, results) {
            // if error notify user
            if (error) {
                // TODO: log error
                console.log(error.message);
                return res.send({ errors: { msg: error.message } });
            }
            let obj = messageHandler.onInfo(results);
            return res.send(obj);
        });

    });

};