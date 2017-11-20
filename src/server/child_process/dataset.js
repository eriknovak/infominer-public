console.log('Starting child process, id= ' + process.pid);

///////////////////////////////////////////////
// Set infinite interval and params
///////////////////////////////////////////////

let interval_id = setInterval(() => { }, 10 * 1000);

// internal modules
const BaseDataset = require('../../lib/baseDataset');

// database placeholder
let database = null;

///////////////////////////////////////////////
// Parent-child communication
///////////////////////////////////////////////

process.on('message', (msg) => {
    console.log('Received message from parent, this process id = ' + process.pid);
    handle(msg);
});
process.on('SIGINT', () => {
    console.log('Received SIGINT, this process id = ' + process.pid);
    shutDownProcess({ reqId: 'SIGINT' });
});
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, this process id = ' + process.pid);
    shutDownProcess({ reqId: 'SIGTERM' });
});

//////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////
// Documentation objects
///////////////////////////////////////////////

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

///////////////////////////////////////
// Message Handler
///////////////////////////////////////

/**
 *
 * @param {process_message} msg - The message to the child process.
 */
function handle(msg) {
    if (!msg.body.cmd) {
        console.log('Unknown message - missing cmd: ' + JSON.stringify(msg));
        return;
    }
    switch (msg.body.cmd) {
    case 'init':
        console.log('Initialize child process id=', process.pid);
        break;
    case 'create':
        console.log('Creating database in child process id=', process.pid);
        createDatabase(msg);
        break;
    case 'open':
        console.log('Opening database in child process id=', process.pid);
        openDatabase(msg);
        break;
    case 'info':
        console.log('Get database info in child process id=', process.pid);
        getDatasetInfo(msg);
        break;
    case 'shutdown':
        console.log('Received shutdown command');
        shutDownProcess(msg);
        break;
    default:
        console.log('Unknown cmd in child process, cmd=' + msg.body.cmd);
        break;
    }
}

///////////////////////////////////////
// Action functions
///////////////////////////////////////

function shutDownProcess(msg) {
    let { reqId } = msg;
    try {
        if (database) { database.close(); }
        console.log(msg);
        process.send({ reqId, content: { status: 'done', cmd: 'shutdown' } });
    } catch(err) {
        console.log(msg);
        process.send({ reqId, error: err });
    }
    clearInterval(interval_id);
    process.exit(0);
}

function openDatabase(msg) {
    console.log(msg);

    // TODO: validate json schema
    let { reqId, body } = msg;

    try {
        // get the constructor parameters
        console.log(body);
        let { datasetId, params } = body.content;
        // create the database
        database = new BaseDataset(params);
        console.log(database);

        // everything is ok
        process.send({ reqId, content: { datasetId } });
    } catch (err) {
        console.log('openDatabase Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err });
    }
}

function createDatabase(msg) {
    // TODO: validate json schema
    let { reqId, body } = msg;
    try {
        // get the constructor parameters
        let { datasetId, dataset, filePath, fields, params } = body.content;
        // create the database
        database = new BaseDataset(params, fields);
        // fill the database with the records
        database.pushDocsToBase(filePath, fields, dataset);
        // everything is ok
        process.send({ reqId, content: { datasetId } });
    } catch (err) {
        console.log('createDatabase Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err });
    }
}

function getDatasetInfo(msg) {
    // TODO: validate json schema
    let { reqId } = msg;
    try {
        console.log(msg.body.content);
        let jsonResults = database.getDatasetInfo(msg.body.content);
        console.log(jsonResults);
        process.send({ reqId, content: { jsonResults } });
    } catch (err) {
        console.log('getDatasetInfo Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err });
    }
}


///////////////////////////////////////////////
//
///////////////////////////////////////////////