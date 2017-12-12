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
                console.log(datasetInfo);
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
                console.log(err); return res.end();
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
                            return res.send({ errors: { msg: xerr.message } });
                        }

                        // initiate child process
                        let datasetInfo = results[0];
                        let datasetId = parseInt(datasetInfo.id);
                        processHandler.createChild(datasetId);

                        // redirect the user to dataset
                        res.send({ datasetId });

                        // body of the message
                        let body = {
                            cmd: 'create_dataset',
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
                        // create dataset
                        processHandler.send(datasetId, body);

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

        let body = { cmd: 'get_dataset_info' };
        sendToProcess(datasetId, owner, body, function (error, results) {
            // if error notify user
            if (error) {
                // TODO: log error
                console.log('GET datasets/:datasets_id', error.message);
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

        pg.delete({ id: datasetId, owner }, 'datasets', (err) => {
            if (err) {
                // TODO: handle error
                console.log('DELETE datasets/:datasets_id', err.message);
            }
            // respond to request
            res.send({});

            let body = { cmd: 'shutdown' };
            sendToProcess(datasetId, owner, body, function (error, results) {
                // if error notify user
                if (error) {
                    // TODO: log error
                    console.log('DELETE datasets/:datasets_id', error.message);
                    return res.send({ errors: { msg: error.message } });
                }
                // delete dataset
                let datasetDbPath = results.dbPath;
                if (datasetDbPath) { fileManager.removeFolder(datasetDbPath); }
            }); // sendToProcess
        });

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
    });

    /**
     * POST a new subset to the databse
     */
    app.post('/api/datasets/:dataset_id/subsets', (req, res) => {
        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        // get the user
        let owner = req.user || 'user';

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
            page: parseInt(req.query.page),
            sort: req.query.sort
        };

        // get the user
        let owner = req.user || 'user';

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
    });

    app.get('/api/datasets/:dataset_id/methods', (req, res) => {

        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        // get the user
        let owner = req.user || 'user';

        // set the body info
        let body = { cmd: 'get_method_info' };
        sendToProcess(datasetId, owner, body, function (error, results) {
            // if error notify user
            if (error) {
                // TODO: log error
                console.log('GET datasets/:datasets_id/methods', error.message);
                return res.send({ errors: { msg: error.message } });
            }
            let obj = messageHandler.onInfo(results);
            return res.send(obj);
        });
    });

    /**
     * get subset info of dataset with id=dataset_id and subset_id=subset_id
     */
    app.get('/api/datasets/:dataset_id/methods/:method_id', (req, res) => {

        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        let methodId = parseInt(req.params.method_id);

        // get the user
        let owner = req.user || 'user';

        // set the body info
        let body = { cmd: 'get_method_info', content: { methodId } };
        sendToProcess(datasetId, owner, body, function (error, results) {
            // if error notify user
            if (error) {
                // TODO: log error
                console.log('GET datasets/:datasets_id/methods/:method_id', error.message);
                return res.send({ errors: { msg: error.message } });
            }
            let obj = messageHandler.onInfo(results);
            return res.send(obj);
        });
    });

    /**
     * POST a new method to the database
     */
    app.post('/api/datasets/:dataset_id/methods', (req, res) => {
        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        // get the user
        let owner = req.user || 'user';

        let { method } = req.body;

        console.log(method);
        // change the method type
        method.type = method.methodType;
        delete method.methodType;
        console.log(method);

        // set the body info
        let body = { cmd: 'create_method', content: { method } };
        sendToProcess(datasetId, owner, body, function (error, results) {
            // if error notify user
            if (error) {
                // TODO: log error
                console.log('POST datasets/:datasets_id/methods', error.message);
                return res.send({ errors: { msg: error.message } });
            }
            let obj = messageHandler.onInfo(results);
            return res.send(obj);
        });
    });

};