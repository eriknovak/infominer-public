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
 * @property {String} filePath - The file values.
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

    /////////////////////////////////////////////////////////////////
    // database handling cases
    /////////////////////////////////////////////////////////////////

    case 'init':
        console.log('Initialize child process id=', process.pid);
        break;
    case 'create_dataset':
        console.log('Creating database in child process id=', process.pid);
        createDatabase(msg);
        break;
    case 'open_dataset':
        console.log('Opening database in child process id=', process.pid);
        openDatabase(msg);
        break;
    case 'shutdown':
        console.log('Received shutdown command');
        shutDownProcess(msg);
        break;

    /////////////////////////////////////////////////////////////////
    // database info retrieving
    /////////////////////////////////////////////////////////////////

    case 'get_dataset_info':
        console.log('Get database info in child process id=', process.pid);
        getDatasetInfo(msg);
        break;
    case 'get_subset_info':
        console.log('Get subset info in child process id=', process.pid);
        getSubsetInfo(msg);
        break;
    case 'subset_documents_info':
        console.log('Get subset info in child process id=', process.pid);
        getSubsetDocuments(msg);
        break;
    case 'create_subset':
        console.log('Get subset info in child process id=', process.pid);
        createSubset(msg);
        break;
    case 'get_method_info':
        console.log('Get method info in child process id=', process.pid);
        getMethodInfo(msg);
        break;
    case 'create_method':
        console.log('Get method info in child process id=', process.pid);
        createMethod(msg);
        break;
    default:
        console.log('Unknown cmd in child process, cmd=' + msg.body.cmd);
        break;
    }
}

///////////////////////////////////////
// database handling cases
///////////////////////////////////////

function openDatabase(msg) {
    // TODO: validate json schema
    let { reqId, body } = msg;

    try {
        // get the constructor parameters
        let { params } = body.content;
        // create the database
        database = new BaseDataset(params);
        // everything is ok
        process.send({ reqId, content: { datasetId: database.getId() } });
    } catch (err) {
        console.log('openDatabase Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err.message });
    }
}

function createDatabase(msg) {
    // TODO: validate json schema
    let { reqId, body } = msg;
    try {
        // get the constructor parameters
        let { filePath, fields, params } = body.content;
        // create the database
        database = new BaseDataset(params, fields);
        // fill the database with the records
        database.pushDocsToBase(filePath, fields);
        // everything is ok
        process.send({ reqId, content: { datasetId: database.getId() } });
    } catch (err) {
        console.log('createDatabase Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err.message });
    }
}

function shutDownProcess(msg) {
    let { reqId } = msg;
    try {
        let dbPath = null;
        if (database) {
            dbPath = database.getDbPath();
            database.close();
        }
        process.send({ reqId, content: { dbPath } });
    } catch(err) {
        process.send({ reqId, error: err.message });
    }
    clearInterval(interval_id);
    process.exit(0);
}

///////////////////////////////////////////////
// database info retrieving
///////////////////////////////////////////////

function getDatasetInfo(msg) {
    // TODO: validate json schema
    let { reqId } = msg;
    try {
        let jsonResults = database.getDatasetInfo();
        process.send({ reqId, content: { jsonResults } });
    } catch (err) {
        console.log('getDatasetInfo Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err.message });
    }
}

/////////////////////////////
// subset functions

function getSubsetInfo(msg) {
    // TODO: validate json schema
    let { reqId, body } = msg;
    try {
        console.log(body);
        let subsetId = body.content ? body.content.subsetId : null;
        console.log('subsetid inside', subsetId);
        let jsonResults = database.getSubsetInfo(subsetId);
        process.send({ reqId, content: { jsonResults } });
    } catch (err) {
        console.log('getSubsetInfo Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err.message });
    }
}

function createSubset(msg) {
    // TODO: validate json schema
    let { reqId, body } = msg;
    try {
        let { subset } = body.content;
        let jsonResults = database.createSubset(subset);
        process.send({ reqId, content: { jsonResults } });
    } catch (err) {
        console.log('getSubsetInfo Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err.message });
    }
}

function getSubsetDocuments(msg) {
    // TODO: validate json schema
    let { reqId, body } = msg;
    try {
        let subsetId = body.content.subsetId;
        let query = body.content.query;
        let jsonResults = database.getSubsetDocuments(subsetId, query);
        process.send({ reqId, content: { jsonResults } });
    } catch (err) {
        console.log('getSubsetInfo Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err.message });
    }
}

/////////////////////////////
// method functions

function getMethodInfo(msg) {
    // TODO: validate json schema
    let { reqId, body } = msg;
    console.log(msg);
    try {
        let methodId = body.content ? body.content.methodId : null;
        let jsonResults = database.getMethodInfo(methodId);
        process.send({ reqId, content: { jsonResults } });
    } catch (err) {
        console.log('getMethodInfo Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err.message });
    }
}

function createMethod(msg) {
    // TODO: validate json schema
    let { reqId, body } = msg;
    try {
        let { method } = body.content;
        let jsonResults = database.createMethod(method);
        process.send({ reqId, content: { jsonResults } });
    } catch (err) {
        console.log('getMethodInfo Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err.message });
    }
}