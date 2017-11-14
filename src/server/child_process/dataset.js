// internal modules
const BaseDataset = require('../../lib/baseDataset');

// database placeholder
let database;

// handles when child process is disconnected
process.on('disconnect', () => {
    // if base exists - close
    if (database.base) { database.close(); }
});

/**
 * The dataset field used in QMiner database.
 * @typedef field_instance
 * @type {Object}
 * @property {String} name - The name of the field.
 * @property {String} type - The type of the field.
 * @property {Boolean} included - If the field is included in the database.
 */

/**
 * The object containing dataset creation parameters.
 * @typedef creation_parameters
 * @type {Object}
 * @property {Object} dataset - The dataset values.
 * @property {String} dataset.dir - The dataset dir.
 * @property {String} dataset.label - The user defined dataset label.
 * @property {String} [dataset.description] - The user defined dataset description.
 * @property {Object} file - The file values.
 * @property {String} file.dir - The file directory.
 * @property {field_instance[]} fields - An array of user defined database fields.
 */

/**
 * The message send to the child process.
 * @typedef process_message
 * @type {!Object}
 * @property {String} type - The type corresponding to the process action
 * @property {Object | creation_parameters} body - The body parameters used in the process.
 */

// get message from parent process
process.on('message', (msg) => {

    if (msg.type === 'shutdown') {
        // shutdown the child
        if (database.base) { database.close(); }

    } else if (msg.type === 'create') {
        // construction of the dataset
        try {
            // TODO: validate json schema

            // get the constructor parameters
            let { dataset, file, fields, params } = msg.body;
            // create the database
            database = new BaseDataset(params, fields);
            // fill the database with the records
            database.pushDocsToBase(file, fields, dataset);

            // everything is ok
            process.send({ status: 'done', err: null });
        } catch (err) {
            // notify parent process about the error
            process.send({ status: 'error', err });
        }
    }

});