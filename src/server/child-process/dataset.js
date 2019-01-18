console.log('Starting child process, id= ' + process.pid);

///////////////////////////////////////////////
// Set infinite interval and params
///////////////////////////////////////////////

let interval_id = setInterval(() => { }, 10 * 1000);


// json schema validator
const validator = require('../../lib/validator')({
    // the schemas used to validate the input
    createDataset: require('../../schemas/child-messages/dataset-create'),
    openDataset:   require('../../schemas/child-messages/dataset-open'),
    getDataset:    require('../../schemas/child-messages/dataset-get'),
    editDataset:   require('../../schemas/child-messages/dataset-edit'),
    shutdown:      require('../../schemas/child-messages/shutdown'),
    // subset message schemas
    createSubset:  require('../../schemas/child-messages/subset-create'),
    getSubset:     require('../../schemas/child-messages/subset-get'),
    editSubset:    require('../../schemas/child-messages/subset-edit'),
    deleteSubset:  require('../../schemas/child-messages/subset-delete'),
    getSubsetDocuments: require('../../schemas/child-messages/subset-get-documents'),
    // method message schemas
    createMethod: require('../../schemas/child-messages/method-create'),
    getMethod:    require('../../schemas/child-messages/method-get'),
    editMethod:   require('../../schemas/child-messages/method-edit'),
    deleteMethod: require('../../schemas/child-messages/method-delete'),

    // dataset schemas
    constructorParams:  require('../../schemas/base-dataset/constructor-params'),
    constructorFields:  require('../../schemas/base-dataset/constructor-fields'),
    constructorStore:   require('../../schemas/base-dataset/constructor-store'),
    editDatasetSchema:  require('../../schemas/base-dataset/edit-dataset-schema'),
    featureSchema:      require('../../schemas/base-dataset/features-schema'),
    methodKMeansParams: require('../../schemas/base-dataset/method-kmeans-params')
});

// the subsets and models manager classes
const SubsetsM = require('../../lib/base-util/subsets-manager');
const ModelsM = require('../../lib/base-util/models-manager');

// internal modules
const BaseDataset = require('../../lib/base-dataset');


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
    shutdownProcess({ reqId: 'SIGINT' });
});
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, this process id = ' + process.pid);
    shutdownProcess({ reqId: 'SIGTERM' });
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
        break;
    case 'create_dataset':
        createDatabase(msg);
        break;
    case 'open_dataset':
        openDatabase(msg);
        break;
    case 'shutdown':
        shutdownProcess(msg);
        break;

    /////////////////////////////////////////////////////////////////
    // database info retrieving
    /////////////////////////////////////////////////////////////////

    case 'get_dataset':
        getDataset(msg);
        break;
    case 'edit_dataset':
        editDataset(msg);
        break;
    case 'get_subset':
        getSubset(msg);
        break;
    case 'create_subset':
        createSubset(msg);
        break;
    case 'edit_subset':
        editSubset(msg);
        break;
    case 'delete_subset':
        deleteSubset(msg);
        break;
    case 'get_subset_documents':
        getSubsetDocuments(msg);
        break;
    case 'update_subset_document':
        updateSubsetDocument(msg);
        break;
    case 'get_method':
        getMethod(msg);
        break;
    case 'create_method':
        createMethod(msg);
        break;
    case 'edit_method':
        editMethod(msg);
        break;
    case 'delete_method':
        deleteMethod(msg);
        break;
    case 'get_method_status':
        getMethodStatus(msg);
        break;
    case 'create_method_active_learning':
        createMethodActiveLearning(msg);
        break;
    case 'update_method_active_learning':
        updateMethodActiveLearning(msg);
        break;
    case 'delete_method_active_learning':
        deleteMethodActiveLearning(msg);
        break;
    default:
        break;
    }
}

///////////////////////////////////////
// database handling cases
///////////////////////////////////////

/**
 * message validation function.
 * @param {Object} msg - The message object sent to the child process.
 * @param {Object} schema - The schema the message object must follow.
 * @param {Function} callback - The function called if the message matches the schema.
 */
function messageValidation(msg, schema, callback) {
    // validate message information
    if (validator.validateSchema(msg, schema)) {
        callback(msg);
    } else {
        // the validation found an inconsistences in the object
        process.send({ reqId: msg.reqId, error: 'Sent message is not in a correct schema' });
    }
}


/**
 * The dataset field used in QMiner database.
 * @typedef field_instance
 * @type {Object}
 * @property {String} name - The name of the field.
 * @property {String} type - The type of the field.
 * @property {Boolean} included - If the field is included in the database.
 */

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
    // validate message information
    messageValidation(msg, validator.schemas.createDataset, function (msg) {
        // message is in correct format
        let { reqId, body } = msg;
        try {
            // get the constructor parameters
            let { filePath, fields, params, delimiter } = body.content;
            // initialize for serving to the datasets
            // create the database
            database = new BaseDataset(params, SubsetsM, ModelsM, validator, fields);
            // fill the database with the records
            let result = database.pushDocuments(filePath, delimiter, fields);
            database.aggregateSubset(result.subsets.id);
            // everything is ok
            process.send({ reqId, content: database.getId() });
        } catch (err) {
            console.log('createDatabase Error', err.message);
            // notify parent process about the error
            process.send({ reqId, error: err.message });
        }
    });
}

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
    // validate message information
    messageValidation(msg, validator.schemas.openDataset, function (msg) {
        // message is in correct format
        let { reqId, body } = msg;
        try {
            // get the constructor parameters
            let { params } = body.content;
            // create the database
            database = new BaseDataset(params, SubsetsM, ModelsM, validator);
            process.send({ reqId, content: { datasetId: database.getId() } });
        } catch (err) {
            console.log('openDatabase Error', err.message);
            // notify parent process about the error
            process.send({ reqId, error: err.message });
        }
    });
}

/**
 * Shutdown the child process.
 * @param {Object} msg - Message to open database.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 * @param {Object} msg.body - The body of the message.
 * @param {String} msg.body.cmd - What command needs to be executed.
 */
function shutdownProcess(msg) {
    // validate message information
    messageValidation(msg, validator.schemas.shutdown, function (msg) {
        // message is in correct format
        let { reqId } = msg;
        try {
            let dbPath = null;
            if (database) {
                dbPath = database.getDbPath();
                database.close();
            }
            process.send({ reqId, results: dbPath });
        } catch(err) {
            process.send({ reqId, error: err.message });
        }
        clearInterval(interval_id);
        process.exit(0);
    });
}

///////////////////////////////////////////////
// dataset retrieving
///////////////////////////////////////////////

/**
 * Gets the database info.
 * @param {Object} msg - Message to open database.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 */
function getDataset(msg) {
    // validate message information
    messageValidation(msg, validator.schemas.getDataset, function (msg) {
        let { reqId } = msg;
        try {
            let results = database.getDataset();
            process.send({ reqId, results });
        } catch (err) {
            console.log('getDataset Error', err.message);
            // notify parent process about the error
            process.send({ reqId, error: err.message });
        }
    });
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
function editDataset(msg) {
    // validate message information
    messageValidation(msg, validator.schemas.editDataset, function (msg) {
        let { reqId, body } = msg;
        try {
            let datasetInfo = body.content;
            let results = database.editDataset(datasetInfo);
            process.send({ reqId, results });
        } catch (err) {
            console.log('editDataset Error', err.message);
            // notify parent process about the error
            process.send({ reqId, error: err.message });
        }
    });
}

/////////////////////////////
// subset retrieving


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
    // validate message information
    messageValidation(msg, validator.schemas.createSubset, function (msg) {
        let { reqId, body } = msg;
        try {
            let { subset } = body.content;
            let results = database.createSubset(subset);
            database.aggregateSubset(results.subsets.id);
            results = database.getSubset(results.subsets.id);
            process.send({ reqId, results });
        } catch (err) {
            console.log('createSubset Error', err.message);
            // notify parent process about the error
            process.send({ reqId, error: err.message });
        }
    });
}

/**
 * Gets the database info.
 * @param {Object} msg - Message to open database.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 * @param {Object} msg.body - The body of the message.
 * @param {Object} [msg.body.content] - The content of the message.
 * @param {Object} [msg.body.content.subsetId] - The id of the subset.
 */
function getSubset(msg) {
    // validate message information
    messageValidation(msg, validator.schemas.getSubset, function (msg) {
        let { reqId, body } = msg;
        try {
            let subsetId = body.content ? body.content.subsetId : null;
            let results = database.getSubset(subsetId);
            process.send({ reqId, results });
        } catch (err) {
            console.log('getSubset Error', err.message);
            // notify parent process about the error
            process.send({ reqId, error: err.message });
        }
    });
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
function editSubset(msg) {
    // validate message information
    messageValidation(msg, validator.schemas.editSubset, function (msg) {
        let { reqId, body } = msg;
        try {
            let subsetInfo = body.content;
            let results = database.editSubset(subsetInfo);
            process.send({ reqId, results });
        } catch (err) {
            console.log('editSubset Error', err.message);
            // notify parent process about the error
            process.send({ reqId, error: err.message });
        }
    });
}

/**
 * Delete the subset.
 * @param {Object} msg - Message to delete subset.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 * @param {Object} msg.body - The body of the message.
 * @param {Object} [msg.body.content] - The content of the message.
 * @param {Object} [msg.body.content.subsetId] - The id of the subset.
 */
function deleteSubset(msg) {
    // validate message information
    messageValidation(msg, validator.schemas.deleteSubset, function (msg) {
        let { reqId, body } = msg;
        try {
            let subsetId = body.content.subsetId;
            let results = database.deleteSubset(subsetId);
            process.send({ reqId, results });
        } catch (err) {
            console.log('deleteSubset Error', err.message);
            // notify parent process about the error
            process.send({ reqId, error: err.message });
        }
    });
}

/**
 * Gets the database info.
 * @param {Object} msg - Message to open database.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 * @param {Object} msg.body - The body of the message.
 * @param {Object} msg.body.content - The content of the message.
 * @param {Number} msg.body.content.subsetId - The subset object.
 * @param {Number} msg.body.content.documentId - The document unique id.
 * @param {Number} msg.body.content.document - The document attributes.
 */
function updateSubsetDocument(msg) {
    // validate message information
    let { reqId, body } = msg;
    try {
        let subsetId = body.content.subsetId;
        let document = body.content.document;
        let results = database.updateSubsetDocument(subsetId, document);
        process.send({ reqId, results });
    } catch (err) {
        console.log('updateSubsetDocument Error', err.message);
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
    // validate message information
    messageValidation(msg, validator.schemas.getSubsetDocuments, function (msg) {
        let { reqId, body } = msg;
        try {
            let subsetId = body.content.subsetId;
            let query = body.content.query;
            let results = database.getSubsetDocuments(subsetId, query);
            process.send({ reqId, results });
        } catch (err) {
            console.log('getSubsetDocuments Error', err.message);
            // notify parent process about the error
            process.send({ reqId, error: err.message });
        }
    });
}

/////////////////////////////
// method retrieving

/**
 * Creates a new method.
 * @param {Object} msg - Message to create method.
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
    // validate message information
    messageValidation(msg, validator.schemas.createMethod, function (msg) {
        let { reqId, body } = msg;
        try {
            let { method } = body.content;
            let results = database.createMethod(method);
            process.send({ reqId, results });
        } catch (err) {
            console.log('createMethod Error', err.message);
            // notify parent process about the error
            process.send({ reqId, error: err.message });
        }
    });
}

/**
 * Gets the database info.
 * @param {Object} msg - Message to open database.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 * @param {Object} msg.body - The body of the message.
 * @param {Object} [msg.body.content] - The content of the message.
 * @param {Object} [msg.body.content.methodId] - The id of the method.
 */
function getMethod(msg) {
    // validate message information
    messageValidation(msg, validator.schemas.getMethod, function (msg) {
        let { reqId, body } = msg;
        try {
            let methodId = body.content ? body.content.methodId : null;
            let results = database.getMethod(methodId);
            process.send({ reqId, results });
        } catch (err) {
            console.log('getMethod Error', err.message);
            // notify parent process about the error
            process.send({ reqId, error: err.message });
        }
    });
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
 */
function editMethod(msg) {
    // validate message information
    messageValidation(msg, validator.schemas.editMethod, function (msg) {
        let { reqId, body } = msg;
        try {
            let method = body.content;
            let results = database.editMethod(method);
            process.send({ reqId, results });
        } catch (err) {
            console.log('editMethod Error', err.message);
            // notify parent process about the error
            process.send({ reqId, error: err.message });
        }
    });
}

/**
 * Delete the method.
 * @param {Object} msg - Message to delete method.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 * @param {Object} msg.body - The body of the message.
 * @param {Object} [msg.body.content] - The content of the message.
 * @param {Object} [msg.body.content.methodId] - The id of the method.
 */
function deleteMethod(msg) {
    // validate message information
    messageValidation(msg, validator.schemas.deleteMethod, function (msg) {
        let { reqId, body } = msg;
        try {
            let methodId = body.content.methodId;
            let results = database.deleteMethod(methodId);
            process.send({ reqId, results });
        } catch (err) {
            console.log('deleteMethod Error', err.message);
            // notify parent process about the error
            process.send({ reqId, error: err.message });
        }
    });
}

/**
 * Gets the database info.
 * @param {Object} msg - Message to open database.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 * @param {Object} msg.body - The body of the message.
 * @param {Object} [msg.body.content] - The content of the message.
 * @param {Object} [msg.body.content.hash] - The id of the method.
 */
function getMethodStatus(msg) {
    // validate message information
    let { reqId, body } = msg;
    try {
        let hash = body.content ? body.content.hash : null;
        let results = database.getMethodStatus(hash);
        process.send({ reqId, results });
    } catch (err) {
        console.log('getMethod Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err.message });
    }
}

/**
 * Creates a new method.
 * @param {Object} msg - Message to create method.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 * @param {Object} msg.body - The body of the message.
 * @param {Object} msg.body.content - The content of the message.
 * @param {Object} msg.body.content.method - The subset object.
 * @param {String} msg.body.content.method.methodType - The type of the method.
 * @param {Object} msg.body.content.method.parameters - The parameters of the method.
 * @param {Number} msg.body.content.method.appliedOn - The id of the subset the method was applied on.
 */
function createMethodActiveLearning(msg) {
    // validate message information
    let { reqId, body } = msg;
    try {
        let { method } = body.content;
        let results = database.createMethodActiveLearning(method);
        process.send({ reqId, results });
    } catch (err) {
        console.log('createMethodActiveLearning Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err.message });
    }
}

/**
 * Creates a new method.
 * @param {Object} msg - Message to create method.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 * @param {Object} msg.body - The body of the message.
 * @param {Object} msg.body.content - The content of the message.
 * @param {Object} msg.body.content.method - The subset object.
 * @param {String} msg.body.content.method.methodType - The type of the method.
 * @param {Object} msg.body.content.method.parameters - The parameters of the method.
 * @param {Number} msg.body.content.method.appliedOn - The id of the subset the method was applied on.
 */
function updateMethodActiveLearning(msg) {
    // validate message information
    let { reqId, body } = msg;
    try {
        let { method } = body.content;
        let results = database.updateMethodActiveLearning(method);
        process.send({ reqId, results });
    } catch (err) {
        console.log('updateMethodActiveLearning Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err.message });
    }
}

/**
 * Creates a new method.
 * @param {Object} msg - Message to create method.
 * @param {Number} msg.reqId - The request id - used for for getting the callback
 * what to do with the results.
 * @param {Object} msg.body - The body of the message.
 * @param {Object} msg.body.content - The content of the message.
 * @param {Object} msg.body.content.method - The subset object.
 * @param {String} msg.body.content.method.methodType - The type of the method.
 * @param {Object} msg.body.content.method.parameters - The parameters of the method.
 * @param {Number} msg.body.content.method.appliedOn - The id of the subset the method was applied on.
 */
function deleteMethodActiveLearning(msg) {
    // validate message information
    let { reqId, body } = msg;
    try {
        let { methodId } = body.content;
        let results = database.deleteMethodActiveLearning(methodId);
        process.send({ reqId, results });
    } catch (err) {
        console.log('deleteMethodActiveLearning Error', err.message);
        // notify parent process about the error
        process.send({ reqId, error: err.message });
    }
}