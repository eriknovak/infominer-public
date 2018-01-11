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

///////////////////////////////////////
// Message Handler
///////////////////////////////////////

/**
 * How to handle the process message.
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
    case 'edit_dataset_info':
        console.log('Get database info in child process id=', process.pid);
        editDatasetInfo(msg);
        break;
    case 'get_subset_info':
        console.log('Get subset info in child process id=', process.pid);
        getSubsetInfo(msg);
        break;
    case 'create_subset':
        console.log('Get subset info in child process id=', process.pid);
        createSubset(msg);
        break;
    case 'edit_subset_info':
        console.log('Get subset info in child process id=', process.pid);
        editSubsetInfo(msg);
        break;
    case 'subset_documents_info':
        console.log('Get subset info in child process id=', process.pid);
        getSubsetDocuments(msg);
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

/**
 * The dataset field used in QMiner database.
 * @typedef field_instance
 * @type {Object}
 * @property {String} name - The name of the field.
 * @property {String} type - The type of the field.
 * @property {Boolean} included - If the field is included in the database.
 */

/**
 * Opens the database.
 * @param {Object} msg - Message to open database.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 * @param {Object} msg.body - The body of the message.
 * @param {String} msg.body.cmd - What command needs to be executed.
 * @param {Object} msg.body.content - The content for the body.
 * @param {Object} msg.body.content.params - The initialization parameters.
 * @param {String} msg.body.content.params.dbPath - Where the database is stored.
 * @param {String} msg.body.content.params.mode - In what mode the database should be opened.
 */
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

/**
 * Creates the database.
 * @param {Object} msg - Message to open database.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 * @param {Object} msg.body - The body of the message.
 * @param {String} msg.body.cmd - What command needs to be executed.
 * @param {Object} msg.body.content - The content for the body.
 * @param {Object} msg.body.content.params - The initialization parameters.
 * @param {String} msg.body.content.params.dbPath - Where the database is stored.
 * @param {String} msg.body.content.params.mode - In what mode the database should be opened.
 * @param {Object} msg.body.content.filePath - Where is file for filling the database.
 * @param {field_instance[]} msg.body.content.fields -  where file for filling the database is.
 */
function createDatabase(msg) {
    // TODO: validate json schema
    let { reqId, body } = msg;
    try {
        // get the constructor parameters
        let { filePath, fields, params } = body.content;
        // create the database
        database = new BaseDataset(params, fields);
        // fill the database with the records
        let result = database.pushDocsToBase(filePath, fields);
        database.aggregateSubset(result.subsets.id);
        // everything is ok
        process.send({ reqId, content: { datasetId: database.getId() } });
    } catch (err) {
        console.log('createDatabase Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err.message });
    }
}

/**
 * Shutdown the child process.
 * @param {Object} msg - Message to open database.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 * @param {Object} msg.body - The body of the message.
 * @param {String} msg.body.cmd - What command needs to be executed.
 */
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

/**
 * Gets the database info.
 * @param {Object} msg - Message to open database.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 */
function getDatasetInfo(msg) {
    // TODO: validate json schema
    let { reqId } = msg;
    try {
        let result = database.getDatasetInfo();
        process.send({ reqId, content: { result } });
    } catch (err) {
        console.log('getDatasetInfo Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err.message });
    }
}

/**
 * Gets the database info.
 * @param {Object} msg - Message to open database.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 * @param {Object} [msg.body.content] - The content of the message.
 * @param {Object} [msg.body.content.label] - The new dataset label.
 * @param {Object} [msg.body.content.description] - The new dataset description.
 */
function editDatasetInfo(msg) {
    // TODO: validate json schema
    let { reqId, body } = msg;
    try {
        let datasetInfo = body.content;
        let result = database.editDatasetInfo(datasetInfo);
        process.send({ reqId, content: { result } });
    } catch (err) {
        console.log('updateDatasetInfo Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err.message });
    }
}

/////////////////////////////
// subset functions

/**
 * Gets the database info.
 * @param {Object} msg - Message to open database.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 * @param {Object} msg.body - The body of the message.
 * @param {Object} [msg.body.content] - The content of the message.
 * @param {Object} [msg.body.content.subsetId] - The id of the subset.
 */
function getSubsetInfo(msg) {
    // TODO: validate json schema
    let { reqId, body } = msg;
    try {
        let subsetId = body.content ? body.content.subsetId : null;
        let result = database.getSubsetInfo(subsetId);
        process.send({ reqId, content: { result } });
    } catch (err) {
        console.log('getSubsetInfo Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err.message });
    }
}

/**
 * Gets the database info.
 * @param {Object} msg - Message to open database.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 * @param {Object} msg.body - The body of the message.
 * @param {Object} [msg.body.content] - The content of the message.
 * @param {Object} [msg.body.content.subsetId] - The id of the subset.
 * @param {Object} [msg.body.content.label] - The new subset label.
 * @param {Object} [msg.body.content.description] - The new subset description.
 */
function editSubsetInfo(msg) {
    // TODO: validate json schema
    let { reqId, body } = msg;
    try {
        let subsetInfo = body.content;
        console.log(subsetInfo);
        let result = database.editSubsetInfo(subsetInfo);
        process.send({ reqId, content: { result } });
    } catch (err) {
        console.log('editSubsetInfo Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err.message });
    }
}

/**
 * Gets the database info.
 * @param {Object} msg - Message to open database.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 * @param {Object} msg.body - The body of the message.
 * @param {Object} msg.body.content - The content of the message.
 * @param {Object} msg.body.content.subset - The subset object.
 * @param {Object} msg.body.content.subset.label - The subset label.
 * @param {Object} [msg.body.content.subset.description] - The subset description.
 * @param {Object} msg.body.content.subset.resultedIn - Which method created the subset.
 * @param {Number[]} msg.body.content.subset.documents - Array of document ids the subset contains.
 */
function createSubset(msg) {
    // TODO: validate json schema
    let { reqId, body } = msg;
    try {
        let { subset } = body.content;
        let result = database.createSubset(subset);
        database.aggregateSubset(result.subsets.id);
        result = database.getSubsetInfo(result.subsets.id);
        process.send({ reqId, content: { result } });
    } catch (err) {
        console.log('getSubsetInfo Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err.message });
    }
}

/**
 * Gets the database info.
 * @param {Object} msg - Message to open database.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 * @param {Object} msg.body - The body of the message.
 * @param {Object} msg.body.content - The content of the message.
 * @param {Number} msg.body.content.subsetId - The subset object.
 * @param {Object} [msg.body.content.query] - The query/filter parameters.
 * @param {Number} [msg.body.content.query.limit] - The number of documents it retrieves.
 * @param {Number} [msg.body.content.query.offset] - The retrieval starting point.
 * @param {Number} [msg.body.content.query.page] - The page number based on the limit.
 * @param {Object} [msg.body.content.query.sort] - The sort parameters.
 * @param {String} msg.body.content.query.sort.fieldName - The field by which the sorting is done.
 * @param {String} [msg.body.content.query.sort.sortType] - The flag specifiying is sort is done. Possible: `asc` or `desc`.
 */
function getSubsetDocuments(msg) {
    // TODO: validate json schema
    let { reqId, body } = msg;
    try {
        let subsetId = body.content.subsetId;
        let query = body.content.query;
        let result = database.getSubsetDocuments(subsetId, query);
        process.send({ reqId, content: { result } });
    } catch (err) {
        console.log('getSubsetInfo Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err.message });
    }
}

/////////////////////////////
// method functions

/**
 * Gets the database info.
 * @param {Object} msg - Message to open database.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 * @param {Object} msg.body - The body of the message.
 * @param {Object} [msg.body.content] - The content of the message.
 * @param {Object} [msg.body.content.methodId] - The id of the subset.
 */
function getMethodInfo(msg) {
    // TODO: validate json schema
    let { reqId, body } = msg;
    try {
        let methodId = body.content ? body.content.methodId : null;
        let result = database.getMethodInfo(methodId);
        process.send({ reqId, content: { result } });
    } catch (err) {
        console.log('getMethodInfo Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err.message });
    }
}

/**
 * Gets the database info.
 * @param {Object} msg - Message to open database.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 * @param {Object} msg.body - The body of the message.
 * @param {Object} msg.body.content - The content of the message.
 * @param {Object} msg.body.content.method - The subset object.
 * @param {String} msg.body.content.method.methodType - The type of the method.
 * @param {Object} msg.body.content.method.parameters - The parameters of the method.
 * @param {Object} msg.body.content.method.result - The result of the method.
 * @param {Number} msg.body.content.method.appliedOn - The id of the subset the method was applied on.
 */
function createMethod(msg) {
    // TODO: validate json schema
    let { reqId, body } = msg;
    try {
        let { method } = body.content;
        let result = database.createMethod(method);
        process.send({ reqId, content: { result } });
    } catch (err) {
        console.log('getMethodInfo Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err.message });
    }
}