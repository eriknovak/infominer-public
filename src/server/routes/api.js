// external modules
const multer = require('multer');   // accepting files from client
const stream = require('stream');   // create stream from file buffer
const fs = require('fs');
// internal modules
const fileManager = require('../../lib/fileManager');
const messageHandler = require('../../lib/messageHandler');

// configurations
const static = require('../../config/static');

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
        // query parameters
        let query = req.query;
        // TODO: get username of creator and handle empty user
        const creator = query.user || 'user';
        // get user datasets
        pg.select({ creator }, 'datasets', (err, results) => {
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
    // posts and creates a new dataset
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
        const creator = 'user'; // temporary placeholder

        // get number of datasets the users already has
        pg.select({ creator }, 'datasets', (err, results) => {
            if (err) {
                // TODO: handle error
                console.log(err); return;
            }
            // number of datasets is the name of the new dataset folder
            const dbFolder = results.length ? results[results.length-1].id : 0;

            // set pg dataset values
            const label = dataset.label || 'root';                      // the user defined dataset label
            const dbPath = `${static.dataPath}/${creator}/${dbFolder}`; // dataset directory
            const sourcefile = file.originalname;                       // file original name

            // create dataset directory
            fileManager.createDirectoryPath(dbPath);

            // create write stream in dataset folder
            let filePath = `${dbPath}/${sourcefile}`;
            let writeStream = fs.createWriteStream(filePath);

            // save file in corresponding dataset folder
            let bufferStream = new stream.PassThrough();
            bufferStream.end(file.buffer);
            // pipe buffer stream to write file
            bufferStream.pipe(writeStream)
                .on('finish', () => {
                    // TODO: log completion
                    // save the metadata to postgres
                    pg.insert({ creator, label, dbPath }, 'datasets', (error, results) => {
                        // if error notify user
                        if (error) {
                            // TODO: log error
                            console.log(error.message);
                            return res.send({ errors: { msg: error.message } }); }

                        // initiate child process
                        let datasetId = parseInt(results[0].id);
                        processHandler.createChild(datasetId);

                        // prepare message body
                        dataset.label = label; // set the label of the dataset
                        // body of the message
                        let body = {
                            cmd: 'create',
                            content: {
                                datasetId,
                                dataset,
                                fields,
                                filePath,
                                params: {
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

    app.get('/api/datasets/:dataset_id', (req, res) => {
        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        // get the user and set it as
        let creator = req.user || 'user';

        if (processHandler.childExist(datasetId)) {
            // get dataset information
            let body = { cmd: 'info', content: { datasetId } };
            processHandler.sendAndWait(datasetId, body, (error, results) => {
                // if error notify user
                if (error) {
                    // TODO: log error
                    console.log(error.message);
                    return res.send({ errors: { msg: error.message } });
                }
                let obj = messageHandler.onInfo(results);
                return res.send(obj);
            });
        } else {
            // must first run the child process
            // get path to dataset from postgresql
            pg.select({ id: datasetId, creator }, 'datasets', (err, results) => {
                if (err) {
                    // TODO: log error
                    console.error(err);
                    return res.send({ error: err });
                } else if (results.length === 1) {
                    let datasetInfo = results[0];

                    // initiate child process
                    processHandler.createChild(datasetId);

                    // open dataset in child process
                    let openParams = {
                        cmd: 'open',
                        content: {
                            datasetId,
                            params: {
                                mode: 'open',
                                dbPath: datasetInfo.dbpath
                            }
                        }
                    };
                    processHandler.send(datasetId, openParams);

                    // get database info
                    let infoParams = {
                        cmd: 'info',
                        content: {
                            datasetId,
                            label: datasetInfo.label,
                            created: datasetInfo.created
                        }
                    };
                    processHandler.sendAndWait(datasetId, infoParams, (error, results) => {
                        // if error notify user
                        if (error) { return res.send({ errors: { msg: error.message } }); }
                        // otherwise return results
                        let obj = messageHandler.onInfo(results);
                        return res.send(obj);
                    });
                }

            });
        }

    });
};