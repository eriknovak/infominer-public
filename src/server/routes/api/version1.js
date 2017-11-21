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

    // gets all user defined datasets
    app.get('/api/datasets', (req, res) => {
        // TODO: log calling this route
        // query parameters
        let query = req.query;
        // TODO: get username of creator and handle empty user
        // TODO: get user from the login parameters (passport.js - future work)
        const owner = query.user || 'user';
        // get user datasets
        pg.select({ owner }, 'datasets', (err, results) => {
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
        });
    });


    // TODO: ensure handling large datasets
    // posts file and creates a new dataset
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
            const label = dataset.label;                              // the user defined dataset label
            const description = dataset.description;                  // the description of the dataset
            const dbPath = `${static.dataPath}/${owner}/${dbFolder}`; // dataset directory

            console.log(description);

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
                    pg.insert({ owner, label, description, dbPath }, 'datasets', (error, results) => {
                        // if error notify user
                        if (error) {
                            // TODO: log error
                            console.log(error.message);
                            return res.send({ errors: { msg: error.message } }); }

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
        }); // pg.select({ creator })
    }); // POST /api/dataset/new


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
            openProcess(childId, owner, sendMessage);
        }
    }

    function openProcess(childId, owner, callback) {
        // get the
        pg.select({ id: childId, owner }, 'datasets', (err, results) => {
            if (err) {
                // TODO: log error
                console.error(err);
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
                processHandler.sendAndWait(childId, openParams, function (err) {
                    if (err) { return callback(err); }
                    callback();
                });

            }
        });
    }

    app.get('/api/datasets/:dataset_id', (req, res) => {
        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        // get the user and set it as
        let owner = req.user || 'user';

        let body = { cmd: 'info', content: { datasetId } };
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