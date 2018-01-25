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
     * gets all user defined datasets
     */
    app.get('/api/datasets', (req, res) => {
        // log user request to get upload datasets information
        logger.info('user requests for datasets', { method: req.method, url: req.originalUrl });

        // TODO: get username of creator and handle empty user
        // TODO: get user from the login parameters (passport.js - future work)
        const owner = req.user ? req.user.id : 'user';
        // get user datasets
        pg.select({ owner }, 'datasets', (err, results) => {
            if (err) {
                logger.error('postgres returned an error', { owner, error: err.message });
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
        }); // pg.select({ owner }, 'datasets')

    }); // GET /api/datasets


    /**
     * posts file and creates a new dataset
     * TODO: ensure handling large datasets
     */
    const upload = multer({ storage }).single('file');
    app.post('/api/datasets/uploadTemp', (req, res) => {
        upload(req, res, function (error) {
            if (error) {
                // TODO: handle error
                console.log(error);
                return res.send({ errors: { msg: error.message } });
            }
            // the file was successfully uploaded
            let file = req.file;
            // TODO: get username of creator
            const owner = req.user ? req.user.id : 'user'; // temporary placeholder

            // insert temporary file
            pg.insert({ owner, filepath: file.path, filename: file.filename }, 'tempDatasets', (err) => {
                if (err) {
                    // TODO: log error
                    console.log(err.message);
                    return res.send({ errors: { msg: err.message } });
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
        // TODO: log calling this route
        // get dataset info
        let { dataset, fields } = req.body;

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

            // get temporary file
            pg.select({ owner, filename: dataset.filename }, 'tempDatasets', (xerr, results) => {
                // if error notify user
                if (xerr) {
                    // TODO: log error
                    console.log(xerr.message);
                    return res.send({ errors: { msg: xerr.message } });
                }
                if (results.length !== 1) {
                    // TODO: log error
                    console.log('found multiple temporary datasets with', dataset.filename);
                    return res.send({ errors: { msg: 'found multiple temporary datasets with ' + dataset.filename } });
                }
                // save temporary dataset file information
                let tempDataset = results[0];

                // insert dataset value
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
                    processHandler.sendAndWait(datasetId, body, function (error) {
                        if (error) {
                            // TODO: handle error
                            console.log('Error', error.message);
                            pg.delete({ id: datasetId, owner }, 'datasets');
                        } else {
                            pg.update({ loaded: true }, { id: datasetId }, 'datasets');
                        }
                        pg.delete({ id: tempDataset.id, owner }, 'tempDatasets');
                    }); // processHandler.sendAndWait()

                }); // pg.insert({ owner, label, description, dbPath }, 'datasets')
            }); // pg.select({ owner, filename }, 'tempDatasets')
        }); // pg.select({ owner }, 'datasets')

    }); // POST /api/datasets


    /**
     * get dataset info of dataset with id=dataset_id
     */
    app.get('/api/datasets/:dataset_id', (req, res) => {
        // TODO: check if dataset_id is a number
        let datasetId = parseInt(req.params.dataset_id);
        // get the user
        const owner = req.user ? req.user.id : 'user';

        let body = { cmd: 'get_dataset' };
        sendToProcess(datasetId, owner, body, function (error, results) {
            // if error notify user
            if (error) {
                // TODO: log error
                console.log('GET datasets/:datasets_id', error.message);
                return res.send({ errors: { msg: error.message } });
            }
            return res.send(results);
        }); // sendToProcess

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
            let body = { cmd: 'edit_dataset', content: { label, description } };
            sendToProcess(datasetId, owner, body, function (error, results) {
                // if error notify user
                if (error) {
                    // TODO: log error
                    console.log('PUT datasets/:datasets_id', error.message);
                    return res.send({ errors: { msg: error.message } });
                }
                return res.send(results);
            }); // sendToProcess
        }); // pg.update({ label, description }, 'datasets')

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
                processHandler.sendAndWait(datasetId, body, function (error, dbPath) {
                    // delete dataset folder
                    if (dbPath) { fileManager.removeFolder(dbPath); }
                });
            }); // pg.delete({ id, owner }, 'datasets')

        } else {
            // get the dataset information
            pg.select({ id: datasetId, owner }, 'datasets', (error, results) => {
                // TODO: handle error
                if (error) { console.log('DELETE datasets/:datasets_id', error.message); }

                if (results.length === 1) {
                    let dataset = results[0];

                    // process is already stopped - just delete from table and remove folder
                    pg.delete({ id: datasetId, owner }, 'datasets', function (xerror) {
                        // TODO: handle error
                        if (xerror) { console.log('DELETE datasets/:datasets_id', xerror.message); }
                        // return the process
                        res.send({});

                        // delete dataset folder
                        if (dataset.dbPath) { fileManager.removeFolder(dataset.dbPath); }
                    }); // pg.delete({ id, owner }, 'datasets')
                } else {
                    // TODO: handle unexisting or multiple datasets
                }
            }); // pg.select({ id, owner }, 'datasets')
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
            // TODO: log error
            if (err) { return res.send({ errors: { msg: err.message } }); }

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
        }); // pg.select({ owner }, 'datasets')
    }); // GET /api/datasets/:dataset_id/check
};