// external modules
const multer = require('multer'); // accepting files from client
const path = require('path');
const qm = require('qminer');

// internal modules
const fileManager = require('../../../lib/fileManager');

// configurations
const static = require('../../../config/static');

/**
 * Temporary files folder. It stores all of the files that
 * are found there.
 */
// set destination path
const destinationPath = path.join(__dirname, '../../../../data/temp');
// create desctination path if not existing
fileManager.createDirectoryPath(destinationPath);

// implement disk storage using Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, destinationPath);
    }
});

/**
 * Adds api routes to .
 * @param {Object} app - Express app.
 * @param {Object} pg - Postgres wrapper.
 * @param {Object} processHandler - Child process container.
 * @param {Object} sendToProcess - Function handling the process dynamic.
 */
module.exports = function (app, pg, processHandler, sendToProcess, logger) {

    /**
     * GET all user defined datasets
     */
    app.get('/api/datasets', (req, res) => {
        // log user request
        logger.info('user requested for datasets',
            logger.formatRequest(req)
        );

        // TODO: get username of creator and handle empty user
        const owner = req.user ? req.user.id : 'user';
        // get user datasets
        pg.select({ owner }, 'datasets', (error, results) => {
            if (error) {
                // log postgres error
                logger.error('error [postgres.select]: user request for datasets failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.send({ errors: { msg: error.message } });
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
            // log request success
            logger.info('user request for datasets sucessful',
                logger.formatRequest(req)
            );
            // send the data
            return res.send({ datasets });
        }); // pg.select({ owner }, 'datasets')

    }); // GET /api/datasets


    /**
     * POST file and creates a new dataset
     * TODO: ensure handling large datasets
     */
    const upload = multer({ storage }).single('file');
    app.post('/api/datasets/uploadTemp', (req, res) => {
        // upload the dataset file
        upload(req, res, function (error) {
            if (error) {
                // log multer error
                logger.error('error [multer.upload]: user request to upload dataset failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.send({ errors: { msg: error.message } });
            }

            // log user request
            logger.info('user requested to upload dataset file',
                logger.formatRequest(req)
            );

            // the file was successfully uploaded
            let file = req.file;
            // TODO: get username of creator
            const owner = req.user ? req.user.id : 'user'; // temporary placeholder

            // insert temporary file
            pg.insert({ owner, filepath: file.path, filename: file.filename }, 'tempDatasets', (xerror) => {
                if (xerror) {
                    // log postgres error
                    logger.error('error [postgres.insert]: user request to upload dataset failed',
                        logger.formatRequest(req, { error: xerror.message })
                    );
                    // send error object to user
                    return res.send({ errors: { msg: xerror.message } });
                }

                // get dataset information
                let label = file.originalname;
                let filename = file.filename; // used only to access from postgres
                let size = file.size;

                /////////////////////////////////////////////
                // get fields from uploaded dataset

                // read the file
                let datasetFIn = qm.fs.openRead(file.path);
                // get first row in the document - the fields
                const fields = datasetFIn.readLine().split('|');
                // set field types container
                let fieldTypes = fields.map(() => 'float');
                // set limit - read first limit rows to determine field types
                let limit = 100, count = 1;

                // set field types based on initial rows
                while(!datasetFIn.eof || count < limit) {
                    // escape loop if all fields are strings
                    if (fieldTypes.every(type => type === 'string')) { break; }
                    // document values to determine type of field
                    let document = datasetFIn.readLine().trim();
                    if (document.length === 0) { count++; continue; }
                    let docValues = document.split('|');
                    for (let j = 0; j < docValues.length; j++) {
                        let value = docValues[j];
                        // check if value is a float
                        // TODO: handle examples like '1aa212'
                        if (isNaN(parseFloat(value))) { fieldTypes[j] = 'string'; }
                    }
                    // we read a document - increment the count
                    count++;
                }

                // set field list containing field name and type
                let fieldList = [];
                for (let i = 0; i < fields.length; i++) {
                    fieldList.push({ name: fields[i].trim(), type: fieldTypes[i], included: true });
                }

                // log request success
                logger.info('user request to upload dataset file successful',
                    logger.formatRequest(req)
                );
                // return values to the user - for dataset creation
                return res.send({
                    dataset: {
                        label,
                        filename,
                        size
                    },
                    fieldList
                });

            }); // pg.insert()
        }); // upload()

    }); // POST /api/datasets/uploadTemp

    app.post('/api/datasets', (req, res) => {
        // log user request
        logger.info('user requested to submit data for new dataset',
            logger.formatRequest(req)
        );

        // get dataset info
        let { dataset, fields } = req.body;

        dataset = JSON.parse(dataset);
        fields = JSON.parse(fields);

        // TODO: get username of creator
        const owner = req.user ? req.user.id : 'user'; // temporary placeholder

        // get number of datasets the users already has
        pg.select({ owner }, 'datasets', (error, results) => {
            if (error) {
                // log postgres error
                logger.error('error [postgres.select]: user request to submit data for new dataset failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.send({ errors: { msg: error.message } });
            }

            // number of datasets is the name of the new dataset folder
            const dbFolder = results.length ? results[results.length-1].id : 0;

            // set pg dataset values
            const label = dataset.label;                                // the user defined dataset label
            const description = dataset.description;                    // the description of the dataset
            const dbPath = `${static.dataPath}\\${owner}\\${dbFolder}`; // dataset directory

            // create dataset directory
            fileManager.createDirectoryPath(dbPath);

            // get temporary file
            pg.select({ owner, filename: dataset.filename }, 'tempDatasets', (xerror, results) => {
                if (xerror) {
                    // log postgres error
                    logger.error('error [postgres.select]: user request to submit data for new dataset failed',
                        logger.formatRequest(req, { error: xerror.message })
                    );
                    // send error object to user
                    return res.send({ errors: { msg: xerror.message } });
                }
                if (results.length !== 1) {
                    // log finding multiple results in postgres
                    logger.error('error [postgres.select]: user request to submit data for new dataset failed',
                        logger.formatRequest(req, { error: `multiple or no records found (${results.length}), unable to determine which is required` })
                    );
                    // send error object to user
                    return res.send({ errors: { msg: 'found multiple or no temporary dataset files with name=' + dataset.filename } });
                }
                // save temporary dataset file information
                let tempDataset = results[0];

                // insert dataset value
                pg.insert({ owner, label, description, dbPath }, 'datasets', (yerror, results) => {
                    if (yerror) {
                        // log error when inserting dataset info
                        logger.error('error [postgres.insert]: user request to submit data for new dataset failed',
                            logger.formatRequest(req, { error: xerror.message })
                        );
                        // send error object to user
                        return res.send({ errors: { msg: yerror.message } });
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
                            filePath: tempDataset.filepath,
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
                    processHandler.sendAndWait(datasetId, body, function (zerror) {
                        if (zerror) {
                            // log error when inserting dataset info
                            logger.error('error [node_process]: user request to submit data for new dataset failed',
                                logger.formatRequest(req, { error: zerror.message })
                            );
                            // delete dataset instance in postgres
                            pg.delete({ id: datasetId, owner }, 'datasets');
                        } else {
                            // log user success
                            logger.info('user created new dataset',
                                logger.formatRequest(req, { datasetId: datasetId })
                            );
                            // update dataset - it has been loaded
                            pg.update({ loaded: true }, { id: datasetId }, 'datasets');
                        }
                        // delete the temporary file from postgres
                        pg.delete({ id: tempDataset.id, owner }, 'tempDatasets', function (xxerror) {
                            if (xxerror) {
                                // log error on deleting temporary file from postgres
                                logger.error('error [postgres.delete]: user request to submit data for new dataset failed',
                                    logger.formatRequest(req, { error: xxerror.message })
                                );
                            }

                            try {
                                // remove the temporary file
                                fileManager.removeFile(tempDataset.filepath);
                                // log request success
                                logger.info('user request to create new dataset successful',
                                    logger.formatRequest(req)
                                );
                            } catch (yyerror) {
                                // log error on deleting temporary file
                                logger.error('error [file_manager]: user request to submit data for new dataset failed',
                                    logger.formatRequest(req, { error: xxerror.message })
                                );
                            }

                        });
                    }); // processHandler.sendAndWait()

                }); // pg.insert({ owner, label, description, dbPath }, 'datasets')
            }); // pg.select({ owner, filename }, 'tempDatasets')
        }); // pg.select({ owner }, 'datasets')

    }); // POST /api/datasets


    /**
     * GET dataset info of dataset with id=dataset_id
     */
    app.get('/api/datasets/:dataset_id', (req, res) => {
        // log user request
        logger.info('user requested for dataset',
            logger.formatRequest(req)
        );

        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        // get the user
        const owner = req.user ? req.user.id : 'user';

        let body = { cmd: 'get_dataset' };
        sendToProcess(datasetId, owner, body, function (error, results) {
            // if error notify user
            if (error) {
                // log error when inserting dataset info
                logger.error('error [node_process]: user request for dataset failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.send({ errors: { msg: error.message } });
            }
            // log request success
            logger.info('user request for dataset successful',
                logger.formatRequest(req)
            );
            // send results
            return res.send(results);
        }); // sendToProcess

    }); // GET /api/datasets/:dataset_id

    /**
     * PUT dataset information with id=dataset_id
     */
    app.put('/api/datasets/:dataset_id', (req, res) => {
        // log user request
        logger.info('user requested to modify dataset',
            logger.formatRequest(req)
        );

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
                // log error on deleting temporary file from postgres
                logger.error('error [postgres.update]: user request to modify dataset failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.send({ errors: { msg: error.message } });
            }

            // make update on the process
            let body = { cmd: 'edit_dataset', content: { label, description } };
            sendToProcess(datasetId, owner, body, function (xerror, results) {
                if (xerror) {
                    // log error when inserting dataset info
                    logger.error('error [node_process]: user request to modify dataset failed',
                        logger.formatRequest(req, { error: xerror.message })
                    );
                    // send error object to user
                    return res.send({ errors: { msg: error.message } });
                }
                // log request success
                logger.info('user request to modify dataset successful',
                    logger.formatRequest(req)
                );
                // send results
                return res.send(results);
            }); // sendToProcess
        }); // pg.update({ label, description }, 'datasets')

    }); // PUT /api/datasets/:dataset_id

    /**
     * DELETE dataset with id=dataset_id
     */
    app.delete('/api/datasets/:dataset_id', (req, res) => {
        // log user request
        logger.info('user requested to delete dataset',
            logger.formatRequest(req)
        );

        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        // get the user
        const owner = req.user ? req.user.id : 'user';

        if (processHandler.childExist(datasetId)) {
            // process is already running - just delete from table and
            // shutdown process and remove folder

            // remove dataset from 'dataset' table
            pg.delete({ id: datasetId, owner }, 'datasets', function (error) {
                if (error) {
                    // log error on deleting temporary file from postgres
                    logger.error('error [postgres.delete]: user request to delete dataset failed',
                        logger.formatRequest(req, { error: error.message })
                    );
                }
                // return the process
                res.send({});

                // shutdown process
                let body = { cmd: 'shutdown' };
                // send the request to the process
                processHandler.sendAndWait(datasetId, body, function (xerror, dbPath) {
                    if (xerror) {
                        // log error when inserting dataset info
                        logger.error('error [node_process]: user request to delete dataset failed',
                            logger.formatRequest(req, { error: xerror.message })
                        );
                    }
                    // delete dataset folder
                    try {
                        if (dbPath) { fileManager.removeFolder(dbPath); }
                        // log request success
                        logger.info('user request to delete dataset successful',
                            logger.formatRequest(req)
                        );
                    } catch(yerror) {
                        // log error on deleting temporary file
                        logger.error('error [file_manager]: user request to delete dataset failed',
                            logger.formatRequest(req, { error: yerror.message })
                        );
                    }
                });
            }); // pg.delete({ id, owner }, 'datasets')

        } else {
            // get the dataset information
            pg.select({ id: datasetId, owner }, 'datasets', (error, results) => {
                if (error) {
                    // log error on deleting temporary file from postgres
                    logger.error('error [postgres.select]: user request to delete dataset failed',
                        logger.formatRequest(req, { error: error.message })
                    );
                }
                if (results.length !== 1) {
                    // log finding multiple results in postgres
                    logger.error('error [postgres.select]: user request to delete dataset failed',
                        logger.formatRequest(req, { error: 'multiple dataset with same id found' })
                    );
                }
                let dataset = results[0];

                // process is already stopped - just delete from table and remove folder
                pg.delete({ id: datasetId, owner }, 'datasets', function (xerror) {
                    if (xerror) {
                        // log postgres error
                        logger.error('error [postgres.delete]: user request to delete dataset failed',
                            logger.formatRequest(req, { error: xerror.message })
                        );
                    }
                    // send results
                    res.send({});

                    try {
                        // delete dataset folder
                        if (dataset.dbPath) { fileManager.removeFolder(dataset.dbPath); }
                        // log request success
                        logger.info('user request to delete dataset successful',
                            logger.formatRequest(req)
                        );
                    } catch (yerror) {
                        // log error on deleting temporary file
                        logger.error('error [file_manager]: user request to delete dataset failed',
                            logger.formatRequest(req, { error: yerror.message })
                        );
                    }

                }); // pg.delete({ id, owner }, 'datasets')
            }); // pg.select({ id, owner }, 'datasets')
        }
    }); // GET /api/datasets/:dataset_id

    /**
     * GET dataset status - if its loaded
     */
    app.get('/api/datasets/:dataset_id/check', (req, res) => {
        // log user request
        logger.info('user requested to checked availability of dataset',
            logger.formatRequest(req)
        );

        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);

        // TODO: get username of creator and handle empty user
        const owner = req.user ? req.user.id : 'user';

        pg.select({ id: datasetId, owner }, 'datasets', (error, results) => {
            if (error) {
                // log postgres error
                logger.error('error [postgres.select]: user request to checked availability of dataset failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.send({ errors: { msg: error.message } });
            }

            if (results.length !== 1) {
                // log finding multiple results in postgres
                logger.error('error [postgres.select]: user request to checked availability of dataset failed',
                    logger.formatRequest(req, { error: 'multiple dataset with same id found' })
                );
                // send error object to user
                return res.send({ errors: { msg: 'found multiple datasets with same id' } });
            }

            // there are only one record with that id
            let rec = results[0];
            let datasets = {
                id: rec.id,
                label: rec.label,
                created: rec.created,
                loaded: rec.loaded
            };
            // log request success
            logger.info('user request to check availability of dataset successful',
                logger.formatRequest(req)
            );
            // send the data
            return res.send(datasets);

        }); // pg.select({ owner }, 'datasets')
    }); // GET /api/datasets/:dataset_id/check
};