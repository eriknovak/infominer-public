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
 * Adds api routes to .
 * @param {Object} app - Express app.
 * @param {Object} pg - Postgres wrapper.
 * @param {Object} processHandler - Child process container.
 * @param {Object} sendToProcess - Function handling the process dynamic.
 */
module.exports = function (app, pg, processHandler, sendToProcess) {

    /**
     * gets all user defined datasets
     */
    app.get('/api/datasets', (req, res) => {
        // TODO: log calling this route

        // TODO: get username of creator and handle empty user
        // TODO: get user from the login parameters (passport.js - future work)
        const owner = req.user ? req.user.id : 'user';
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
                    created: rec.created,
                    loaded: rec.loaded
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
        const owner = req.user ? req.user.id : 'user'; // temporary placeholder

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
                        processHandler.sendAndWait(datasetId, body, function (error) {
                            if (error) {
                                // TODO: handle error
                                console.log('Error', error.message);
                                pg.delete({ id: datasetId, owner }, 'datasets');
                            } else {
                                pg.update({ loaded: true }, { id: datasetId }, 'datasets');
                            }
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
        const owner = req.user ? req.user.id : 'user';

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
     * modify dataset info of dataset with id=dataset_id
     */
    app.put('/api/datasets/:dataset_id', (req, res) => {
        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        // get the user
        const owner = req.user ? req.user.id : 'user';

        // get dataset information
        // TODO: check schema structure
        let dataset = req.body.dataset;

        let label = dataset.label;
        let description = dataset.description;

        // update the postgres dataset
        pg.update({ label, description }, { id: datasetId }, 'datasets', function (error) {
            if (error) {
                // TODO: log error
                console.log('PUT datasets/:datasets_id', error.message);
                return res.send({ errors: { msg: error.message } });
            }

            // make update on the process
            let body = { cmd: 'edit_dataset_info', content: { label, description } };
            sendToProcess(datasetId, owner, body, function (error, results) {
                // if error notify user
                if (error) {
                    // TODO: log error
                    console.log('PUT datasets/:datasets_id', error.message);
                    return res.send({ errors: { msg: error.message } });
                }
                let obj = messageHandler.onInfo(results);
                return res.send(obj);
            }); // sendToProcess
        }); // pg.update
    }); // PUT /api/datasets/:dataset_id

    /**
     * get dataset info of dataset with id=dataset_id
     */
    app.delete('/api/datasets/:dataset_id', (req, res) => {
        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        // get the user
        const owner = req.user ? req.user.id : 'user';
        // respond to request

        if (processHandler.childExist(datasetId)) {
            // process is already running - just delete from table and
            // shutdown process and remove folder

            // remove dataset from 'dataset' table
            pg.delete({ id: datasetId, owner }, 'datasets', function (error) {
                if (error) {
                    // TODO: handle error
                    console.log('DELETE datasets/:datasets_id', error.message);
                }
                // return the process
                res.send({});

                // shutdown process
                let body = { cmd: 'shutdown' };
                // send the request to the process
                processHandler.sendAndWait(datasetId, body, function (error, processResults) {
                    // delete dataset folder
                    let datasetDbPath = processResults.dbPath;
                    if (datasetDbPath) { fileManager.removeFolder(datasetDbPath); }
                });
            });
        } else {
            // get the dataset information
            pg.select({ id: datasetId, owner }, 'datasets', (error, results) => {
                if (error) {
                    // TODO: handle error
                    console.log('DELETE datasets/:datasets_id', error.message);
                }
                if (results.length === 1) {
                    let dataset = results[0];

                    // process is already stopped - just delete from table and remove folder
                    pg.delete({ id: datasetId, owner }, 'datasets', function (xerror) {
                        if (xerror) {
                            // TODO: handle error
                            console.log('DELETE datasets/:datasets_id', xerror.message);
                        }
                        // return the process
                        res.send({});

                        // delete dataset folder
                        let datasetDbPath = dataset.dbPath;
                        if (datasetDbPath) { fileManager.removeFolder(datasetDbPath); }
                    });
                }
            });
        }
    }); // GET /api/datasets/:dataset_id

    app.get('/api/datasets/:dataset_id/check', (req, res) => {
        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        // TODO: log calling this route

        // TODO: get username of creator and handle empty user
        // TODO: get user from the login parameters (passport.js - future work)
        const owner = req.user ? req.user.id : 'user';
        // get user datasets
        pg.select({ id: datasetId, owner }, 'datasets', (err, results) => {
            if (err) {
                return res.send({ errors: { msg: err.message } });
            }
            if (results.length === 1) {
                // there are only one record with that id
                let rec = results[0];
                let datasets = {
                    id: rec.id,
                    label: rec.label,
                    created: rec.created,
                    loaded: rec.loaded
                };
                // return the data
                return res.send(datasets);
            } else {
                return res.send({});
            }
        }); // pg.select({ owner })
    });
};