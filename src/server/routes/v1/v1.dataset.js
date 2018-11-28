// external modules
const multer = require('multer'); // accepting files from client
const path = require('path');
const qm = require('qminer');

// internal modules
const fileManager = require('../../../lib/file-manager');
const validator = require('../../../lib/validator')();

// configurations
const static = require('../../../config/static');

/**
 * Temporary files folder. It stores all of the files that
 * are found there.
 */
// set destination path
const destinationPath = path.join(__dirname, '../../../../data/temporary-files');
// create desctination path if not existing
fileManager.createDirectoryPath(destinationPath);

// implement disk storage using Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, destinationPath);
    }
});

/**
 * Detects the delimiter of the file.
 * @param {String} filePath - The path to the file.
 * @param {String} delimiters - Possible delimiters.
 * @returns {String|Null} The delimiter used in the dataset or null if none are found.
 */
function detectDelimiter(filePath, delimiters = [',', ';', '\t', '|', '~']) {
    // go through all delimiters
    let validDelimiters = [];
    for (let delimiter of delimiters) {
        // get the dataset information from the file
        let datasetIn = qm.fs.openRead(filePath);

        // get number of attributes using the number of delimiters
        let header = datasetIn.readLine().trim();

        // does the header contain only one attribute
        if (header.search(/[^a-zA-Z0-9]/g) === -1) {
            datasetIn.close();
            return '\nww';
        }

        // get the number of attributes and set initial
        let numberOfAttributes = header.split(delimiter).length,
            validDelimiter = true,
            rowCount = 0;

        // check the first 10 lines within the dataset
        while (!datasetIn.eof) {
            if (rowCount >= 10) { break; }
            // get the next row in the dataset
            let document = datasetIn.readLine();
            // skip empty lines
            if (document.length === 0) { continue; }

            // check if number of attributes and values match
            let numberOfValues = document.split(delimiter).length;
            if (numberOfAttributes !== numberOfValues) {
                validDelimiter = false; break;
            }
            rowCount++;
        }
        // if the delimiter is valid and the file header contains the delimiter
        if (validDelimiter && header.includes(delimiter)) {
            validDelimiters.push([delimiter, numberOfAttributes]);
        }
        // close the dataset file
        datasetIn.close();
    }

    // if not valid delimiters were found
    if (!validDelimiters.length) { return null; }
    // select the delimiter with the largest number of attributes
    return validDelimiters.reduce((maximum, current) => {
        return current[1] > maximum[1] ? current : maximum;
    }, validDelimiters[0])[0];
}


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
        const owner = req.user ? req.user.id : 'development';
        // get user datasets
        pg.select({ owner }, 'infominer_datasets', (error, results) => {
            if (error) {
                // log postgres error
                logger.error('error [postgres.select]: user request for datasets failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.status(500).json({ errors: { msg: error.message } });
            }
            // create JSON API data
            let datasets = results.map(rec => {
                return {
                    id: rec.id,
                    type: 'dataset',
                    label: rec.label,
                    created: rec.created,
                    status: rec.status
                };
            });
            // log request success
            logger.info('user request for datasets sucessful',
                logger.formatRequest(req)
            );
            // send the data
            return res.json({ datasets });
        }); // pg.select({ owner }, 'infominer_datasets')

    }); // GET /api/datasets


    /**
     * POST file and creates a new dataset
     */
    const upload = multer({ storage }).single('file');
    app.post('/api/datasets', (req, res) => {
        // upload the dataset file
        upload(req, res, function (error) {
            if (error) {
                // log multer error
                logger.error('error [multer.upload]: user request to upload dataset failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.status(500).json({ errors: { msg: error.message } });
            }

            // log user request
            logger.info('user requested to upload dataset file',
                logger.formatRequest(req)
            );

            // the file was successfully uploaded
            let file = req.file;
            // TODO: get username of creator
            const owner = req.user ? req.user.id : 'development'; // temporary placeholder

            // get the delimiter within the
            let delimiter = detectDelimiter(file.path);
            if (!delimiter) {
                // delimiter is not recognized - send warning to user
                fileManager.removeFile(file.path);
                // log multer error
                logger.warn('warn [file.format]: unknown delimiter',
                    logger.formatRequest(req, { error: 'unknown delimiter' })
                );
                // send error object to user
                return res.json({ errors: {
                    filename: file.originalname,
                    msg: 'unknown delimiter, check if the delimiter is one of the following options ",", ";", "\t", "|", "~"' }
                });
            }

            let datasetInformation = {
                owner,
                status: 'in_queue',
                parameters: {
                    filepath: file.path,
                    filename: file.filename,
                    delimiter: delimiter
                }
            };

            // insert temporary file
            pg.insert(datasetInformation, 'infominer_datasets', (xerror, xresults) => {
                if (xerror) {
                    // log postgres error
                    logger.error('error [postgres.insert]: user request to upload dataset failed',
                        logger.formatRequest(req, { error: xerror.message })
                    );
                    // send error object to user
                    return res.status(500).json({ errors: { msg: xerror.message } });
                }

                // get dataset information
                let datasetId = xresults[0].id;
                let label = file.originalname;
                let filename = file.filename; // used only to access from postgres

                /////////////////////////////////////////////
                // get fields from uploaded dataset

                // read the file
                let datasetFIn = qm.fs.openRead(file.path);
                // get first row in the document - the fields
                const fields = datasetFIn.readLine().trim().split(delimiter);
                // set field types container
                let fieldTypes = fields.map(() => null);
                // set limit - read first limit rows to determine field types
                let limit = 100, count = 1;

                // set field types based on initial rows
                while(!datasetFIn.eof && limit > count) {
                    // document values to determine type of field
                    let document = datasetFIn.readLine().trim();
                    if (document.length === 0) { count++; continue; }
                    let docValues = document.split(delimiter);

                    if (docValues.length !== fields.length) {
                        // delimiter is not recognized - send warning to user
                        return pg.delete({ owner, parameters: { filename } }, 'infominer_datasets', (yerror) => {
                            fileManager.removeFile(file.path);
                            // log multer error
                            logger.warn('warn [file.format]: number of values not matching with number of fields',
                                logger.formatRequest(req, { error: 'number of values not matching with number of fields', values: docValues.length, fields: fields.length })
                            );
                            // send error object to user
                            return res.json({ errors: {
                                filename: file.originalname,
                                msg: `number of values not matching with number of fields in row ${count+1}` }
                            });
                        });
                    }

                    let validTypes = ['float', 'datetime', 'string_v', 'string'];

                    for (let j = 0; j < docValues.length; j++) {
                        let value = docValues[j];
                        let categorySelection = value.match(/\S*[\\\/][\w]+|[\w]+/gi);
                        // check if value has a pathway
                        if (!validTypes.slice(1).includes(fieldTypes[j]) &&
                            !value.match(/[^0-9,\.]+/gi)) {
                                // the value is a number
                                fieldTypes[j] = 'float';
                        } else if (!validTypes.slice(2).includes(fieldTypes[j]) &&
                            Date.parse(value)) {
                            fieldTypes[j] = 'datetime';
                        } else if (!validTypes.slice(3).includes(fieldTypes[j]) &&
                            categorySelection &&
                            categorySelection.length === 1 &&
                            categorySelection[0] === value) {
                                // the value is a
                                fieldTypes[j] = 'string_v';
                        } else { fieldTypes[j] = 'string'; }
                    }
                    // we read a document - increment the count
                    count++;
                }
                // the dataset file is not needed anymore
                datasetFIn.close();
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
                return res.json({
                    dataset: {
                        id: datasetId,
                        label,
                        filename
                    },
                    fieldList
                });

            }); // pg.insert()
        }); // upload()

    });

    app.post('/api/datasets/:dataset_id', (req, res) => {
        // log user request
        logger.info('user requested to submit data for new dataset',
            logger.formatRequest(req)
        );

        // get dataset information
        // check if dataset_id is an integer
        let datasetId = parseInt(req.params.dataset_id);
        if (!validator.validateInteger(datasetId)) {
            // log error when datasetId is not an integer
            logger.error('error [route_parameter]: user request for dataset failed',
                logger.formatRequest(req, { error: 'Parameter dataset_id is not an integer' })
            );
            // send error object to user
            return res.status(500).json({ errors: { msg: 'Parameter dataset_id is not an integer' } });
        }
        let { dataset, fields } = req.body;

        dataset = JSON.parse(dataset);
        fields = JSON.parse(fields);

        // TODO: get username of creator
        const owner = req.user ? req.user.id : 'development'; // temporary placeholder

        // get number of datasets the users already has
        pg.select({ owner }, 'infominer_datasets', (error, results) => {
            if (error) {
                // log postgres error
                logger.error('error [postgres.select]: user request to submit data for new dataset failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.status(500).json({ errors: { msg: error.message } });
            }

            // number of datasets is the name of the new dataset folder
            const dbFolder = Math.random().toString(36).substring(2, 15) +
                             Math.random().toString(36).substring(2, 15) +
                             Date.now();

            // set pg dataset values
            let datasetInformation = {
                label: dataset.label, // the user defined dataset label
                dbPath: path.join(static.dataPath, owner.toString(), dbFolder.toString()), // dataset directory
                description: dataset.description, // the description of the dataset
                status: 'processing'
            };

            // update dataset value
            pg.update(datasetInformation, { id: datasetId, owner }, 'infominer_datasets', (yerror, results) => {
                if (yerror) {
                    // log error when inserting dataset info
                    logger.error('error [postgres.update]: user request to submit data for new dataset failed',
                        logger.formatRequest(req, { error: xerror.message })
                    );
                    // send error object to user
                    return res.status(500).json({ errors: { msg: yerror.message } });
                }

                // initiate child process
                let datasetInfo = results[0];
                let datasetId = parseInt(datasetInfo.id);
                processHandler.createChild(datasetId);

                // return dataset id for future status check
                res.json({ datasetId });

                // body of the message
                let body = {
                    cmd: 'create_dataset',
                    content: {
                        fields,
                        filePath: datasetInfo.parameters.filepath,
                        delimiter: datasetInfo.parameters.delimiter,
                        params: {
                            datasetId,
                            label: datasetInfo.label,
                            description: datasetInfo.description,
                            created: datasetInfo.created,
                            mode: 'createClean',
                            dbPath: datasetInfo.dbpath
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
                        pg.delete({ id: datasetId, owner }, 'infominer_datasets');
                    } else {
                        // log user success
                        logger.info('user created new dataset',
                            logger.formatRequest(req, { datasetId: datasetId })
                        );

                        let updatedDataset = {
                            status: 'finished',
                            parameters: {
                                filepath: null,
                                filename: null,
                                delimiter: datasetInfo.parameters.delimiter
                            }
                        };

                        // update dataset - it has been loaded
                        pg.update(updatedDataset, { id: datasetId }, 'infominer_datasets');
                        // log request success
                        logger.info('user request to create new dataset successful',
                            logger.formatRequest(req)
                        );
                    }

                    try {
                        // remove the temporary file
                        fileManager.removeFile(datasetInfo.parameters.filepath);
                        // log request success
                        logger.info('user request to create new dataset - temporary file deletion successful',
                            logger.formatRequest(req)
                        );
                    } catch (yyerror) {
                        // log error on deleting temporary file
                        logger.error('error [file_manager]: user request to submit data for new dataset - temporary file deletion failed',
                            logger.formatRequest(req, { error: yyerror.message })
                        );
                    }

                }); // processHandler.sendAndWait()

            }); // pg.update('infominer_datasets')
        }); // pg.select('infominer_datasets')
    }); // POST /api/datasets/:dataset_id


    /**
     * GET dataset info of dataset with id=dataset_id
     */
    app.get('/api/datasets/:dataset_id', (req, res) => {
        // log user request
        logger.info('user requested for dataset',
            logger.formatRequest(req)
        );

        // check if dataset_id is an integer
        let datasetId = parseInt(req.params.dataset_id);
        if (!validator.validateInteger(datasetId)) {
            // log error when datasetId is not an integer
            logger.error('error [route_parameter]: user request for dataset failed',
                logger.formatRequest(req, { error: 'Parameter dataset_id is not an integer' })
            );
            // send error object to user
            return res.status(500).json({ errors: { msg: 'Parameter dataset_id is not an integer' } });
        }

        // get the user
        const owner = req.user ? req.user.id : 'development';

        let body = { cmd: 'get_dataset' };
        sendToProcess(datasetId, owner, body, function (error, results) {
            // if error notify user
            if (error) {
                // log error when inserting dataset info
                logger.error('error [node_process]: user request for dataset failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.status(500).json({ errors: { msg: error.message } });
            }
            // log request success
            logger.info('user request for dataset successful',
                logger.formatRequest(req)
            );
            // send results
            return res.json(results);
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

        // check if dataset_id is an integer
        let datasetId = parseInt(req.params.dataset_id);
        if (!validator.validateInteger(datasetId)) {
            // log error when datasetId is not an integer
            logger.error('error [route_parameter]: user request to modify dataset failed',
                logger.formatRequest(req, { error: 'Parameter dataset_id is not an integer' })
            );
            // send error object to user
            return res.json({ errors: { msg: 'Parameter dataset_id is not an integer' } });
        }

        // get the user
        const owner = req.user ? req.user.id : 'development';

        // get dataset information
        let { label, description, fields } = req.body.dataset;

        pg.select({ id: datasetId, owner }, 'infominer_datasets', (error, results) => {
            // get all parameters so that we avoid overriding
            let dataset = results[0];

            if (label) dataset.label = label;
            if (description) dataset.description = description;

            if (fields) {
                let fieldParameters = { };
                fields.forEach(field => {
                    fieldParameters[field.name] = { };
                    fieldParameters[field.name].showInVisual = field.showInVisual;
                    fieldParameters[field.name].showInTable = field.showInTable;
                });
                dataset.parameters.fields = fieldParameters;
            }

            // update the postgres dataset
            pg.update(dataset, { id: datasetId, owner }, 'infominer_datasets', function (error) {
                if (error) {
                    // log error on deleting temporary file from postgres
                    logger.error('error [postgres.update]: user request to modify dataset failed',
                        logger.formatRequest(req, { error: error.message })
                    );
                    // send error object to user
                    return res.status(500).json({ errors: { msg: error.message } });
                }

                // make update on the process
                let body = { cmd: 'edit_dataset', content: { label, description, fields } };
                sendToProcess(datasetId, owner, body, function (xerror, results) {
                    if (xerror) {
                        // log error when inserting dataset info
                        logger.error('error [node_process]: user request to modify dataset failed',
                            logger.formatRequest(req, { error: xerror.message })
                        );
                        // send error object to user
                        return res.status(500).json({ errors: { msg: xerror.message } });
                    }
                    // log request success
                    logger.info('user request to modify dataset successful',
                        logger.formatRequest(req)
                    );
                    // send results
                    return res.json(results);
                }); // sendToProcess
            }); // pg.update({ label, description, parameters }, 'infominer_datasets')

        });
    }); // PUT /api/datasets/:dataset_id

    /**
     * DELETE dataset with id=dataset_id
     */
    app.delete('/api/datasets/:dataset_id', (req, res) => {
        // log user request
        logger.info('user requested to delete dataset',
            logger.formatRequest(req)
        );

        // check if dataset_id is an integer
        let datasetId = parseInt(req.params.dataset_id);
        if (!validator.validateInteger(datasetId)) {
            // log error when datasetId is not an integer
            logger.error('error [route_parameter]: user request to delete dataset failed',
                logger.formatRequest(req, { error: 'Parameter dataset_id is not an integer' })
            );
            // send error object to user
            return res.json({ errors: { msg: 'Parameter dataset_id is not an integer' } });
        }

        // get the user
        const owner = req.user ? req.user.id : 'development';

        if (processHandler.childExist(datasetId)) {
            // process is already running - just delete from table and
            // shutdown process and remove folder

            // remove dataset from 'dataset' table
            pg.delete({ id: datasetId, owner }, 'infominer_datasets', function (error) {
                if (error) {
                    // log error on deleting temporary file from postgres
                    logger.error('error [postgres.delete]: user request to delete dataset failed',
                        logger.formatRequest(req, { error: error.message })
                    );
                }
                // return the process
                res.json({ });

                // shutdown process
                let body = { cmd: 'shutdown' };
                // send the request to the process
                processHandler.sendAndWait(datasetId, body, function (xerror, dbpath) {
                    if (xerror) {
                        // log error when inserting dataset info
                        logger.error('error [node_process]: user request to delete dataset failed',
                            logger.formatRequest(req, { error: xerror.message })
                        );
                    }
                    // delete dataset folder
                    try {
                        if (dbpath) { fileManager.removeFolder(dbpath); }
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
            }); // pg.delete({ id, owner }, 'infominer_datasets')

        } else {
            // get the dataset information
            pg.select({ id: datasetId, owner }, 'infominer_datasets', (error, results) => {
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
                pg.delete({ id: datasetId, owner }, 'infominer_datasets', function (xerror) {
                    if (xerror) {
                        // log postgres error
                        logger.error('error [postgres.delete]: user request to delete dataset failed',
                            logger.formatRequest(req, { error: xerror.message })
                        );
                    }
                    // send results
                    res.json({ });

                    try {
                        // delete dataset folder
                        if (dataset.dbpath) { fileManager.removeFolder(dataset.dbpath); }
                        if (dataset.parameters.filepath) {
                            fileManager.removeFile(dataset.parameters.filepath);
                        }
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

                }); // pg.delete({ id, owner }, 'infominer_datasets')
            }); // pg.select({ id, owner }, 'infominer_datasets')
        }
    }); // GET /api/datasets/:dataset_id

    /**
     * GET dataset status - if its loaded
     */
    app.get('/api/datasets/:dataset_id/status', (req, res) => {
        // log user request
        logger.info('user requested to checked availability of dataset',
            logger.formatRequest(req)
        );

        // check if dataset_id is an integer
        let datasetId = parseInt(req.params.dataset_id);
        if (!validator.validateInteger(datasetId)) {
            // log error when datasetId is not an integer
            logger.error('error [route_parameter]: user request to checked availability of dataset failed',
                logger.formatRequest(req, { error: 'Parameter dataset_id is not an integer' })
            );
            // send error object to user
            return res.status(500).json({ errors: { msg: 'Parameter dataset_id is not an integer' } });
        }

        // TODO: get username of creator and handle empty user
        const owner = req.user ? req.user.id : 'development';

        pg.select({ id: datasetId, owner }, 'infominer_datasets', (error, results) => {
            if (error) {
                // log postgres error
                logger.error('error [postgres.select]: user request to checked availability of dataset failed',
                    logger.formatRequest(req, { error: error.message })
                );
                // send error object to user
                return res.status(500).json({ errors: { msg: error.message } });
            }

            if (results.length !== 1) {
                // log finding multiple results in postgres
                logger.error('error [postgres.select]: user request to checked availability of dataset failed',
                    logger.formatRequest(req, { error: 'multiple dataset with same id found' })
                );
                // send error object to user
                return res.json({ errors: { msg: 'found multiple datasets with same id' } });
            }

            // there are only one record with that id
            let rec = results[0];
            let datasets = {
                id: rec.id,
                label: rec.label,
                created: rec.created,
                status: rec.status
            };
            // log request success
            logger.info('user request to check availability of dataset successful',
                logger.formatRequest(req)
            );
            // send the data
            return res.json(datasets);

        }); // pg.select({ owner }, 'infominer_datasets')
    }); // GET /api/datasets/:dataset_id/status
};