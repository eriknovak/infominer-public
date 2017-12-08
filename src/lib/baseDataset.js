// external modules
const qm = require('qminer');
// internal modules
const fileManager = require('./fileManager');

/**
 * The dataset field used in QMiner database.
 * @typedef field_instance
 * @type {Object}
 * @property {String} name - The name of the field.
 * @property {String} type - The type of the field.
 * @property {Boolean} included - If the field is included in the database.
 */

/**
 * The Dataset base container.
 */
class BaseDataset {

    /**
     * Constructing the dataset base.
     * @param {Object} params - The construction parameters.
     * @param {String} params.dbPath - Path to data folder.
     * @param {String} params.mode - The mode in which the base is opened. Possible: 'open' and 'createClean'.
     * @param {field_instance[]} [fields] - The fields of the dataset. Must have when `params.init.mode='createClean'`.
     * @constructor
     */
    constructor(params, fields) {
        let self = this;

        self.params = params;
        // TODO: handle parameter values
        if (!self.params.dbPath) { throw new Error('FieldError: params.dbPath must be defined'); }
        if (!self.params.mode) { throw new Error('FieldError: params.init.mode must be defined'); }

        // loads the base
        self._loadBase(fields);
    }

    /**
     * Loads the base.
     * @param {field_instance[]} [fields] - The fields of the dataset. Must have when `params.init.mode='createClean'`.
     * @private
     */
    _loadBase(fields) {
        let self = this;

        if (self.params.mode === 'createClean') {
            // check required parameters
            if (!fields) { throw new Error('FieldError: fields must be defined'); }
            // create dbPath folders
            fileManager.createDirectoryPath(self.params.dbPath);
            // get the schema for database
            const schema = self._prepareSchema(fields);

            // create new database
            self.base = new qm.Base({
                mode: self.params.mode,
                dbPath: self.params.dbPath,
                schema
            });

        } else if (self.params.mode === 'open') {
            // open database and prepare it for analysis
            self.base = new qm.Base({ mode: self.params.mode, dbPath: self.params.dbPath });
        } else {
            // TODO: handle non-supported mode
            throw new Error('FieldError: params.init.mode must be "createClean", "open" or "openReadOnly"');
        }
    }

    /**
     * Close the database.
     */
    close() {
        this.base.close();
    }

    /**
     * Gets the dataset id.
     * @returns {Number} The dataset id.
     */
    getId() {
        return this.params.datasetId;
    }

    /**
     * Gets the dataset data location.
     * @returns {String} The dataset location.
     */
    getDbPath() {
        return this.params.dbPath;
    }

    /**
     * Prepare database schema.
     * @param {field_instance[]} fields - Array of dataset fields.
     * @return {Object[]} Database schema for given dataset.
     * @private
     */
    _prepareSchema(fields) {
        let schema = require(`${__dirname}/../config/schema.json`);
        // filter out included fields
        const inFields = fields.filter(field => field.included);

        // prepare the dataset fields
        const datasetFields = inFields.map(field => ({ name: field.name, type: field.type, null: true }));
        // TODO: check fields schema

        // replace the schema fields
        schema[0].fields = datasetFields;

        // add dataset schema keys
        let datasetKeys = [ ];
        for (let field of inFields) {
            // string fields are used for keys
            if (field.type === 'string') {
                datasetKeys.push({ field: field.name, type: 'text' });
            }
        }
        // TODO: check keys schema

        // add keys to the schema
        if (datasetKeys.length) { schema[0].keys = datasetKeys; }

        return schema;
    }

    /**
     * Pushes each row of the document to database.
     * @param {String} filePath - File path.
     * @param {field_instance[]} fields - Dataset fields.
     * @param {Object} dataset - Dataset information.
     *
     */
    pushDocsToBase(filePath, fields) {
        let self = this;
        // check required parameters
        if (!filePath) { throw new Error('FieldError: filePath must be defined'); }
        if (!fields) { throw new Error('FieldError: fields must be defined'); }

        // read file and skip first line
        let fileIn = qm.fs.openRead(filePath);
        fileIn.readLine(); // skip header line

        // iterate until end of file
        while (!fileIn.eof) {
            // get new row and its values
            let newLine = fileIn.readLine();
            // skip empty lines
            if (newLine.trim() === '') { continue; }

            let fValues = newLine.trim().split('|');
            // prepare and push record to dataset
            let rec = self._prepareRecord(fValues, fields);
            self.base.store('Dataset').push(rec);
        }
        // create the root subset
        let subset = {
            label: 'root',
            description: 'The root subset. Contains all records of dataset.',
            documents: self.base.store('Dataset').allRecords.map(rec => rec.$id)
        };
        self.createSubset(subset);
    }

    /**
     * Creates an object suitable for database.
     * @param {String[]} values - An array of field values.
     * @param {field_instance[]} fields - An array of field objects.
     * @returns {Object} A record prepared for pushing to database.
     */
    _prepareRecord(values, fields) {
        let self = this;
        // prepare record placeholder
        let rec = { };
        // iterate through fields
        for (let i = 0; i < fields.length; i++) {
            // if the field is included in the database
            if (fields[i].included) {
                rec[fields[i].name] = self._parseFValue(values[i], fields[i].type);
            }
        }
        return rec;
    }

    /**
     * Parses the value in the desired type.
     * @param {String} value - The string in consideration.
     * @param {String} type - The type in which we want to parse.
     * @returns {String|Number} The value parsed in the desired type.
     */
    _parseFValue(value, type) {
        // TODO: handle NaN values
        if (type === 'string') {
            return value;
        } else if (type === 'int') {
            return parseInt(value);
        } else if (type === 'float') {
            return parseFloat(value);
        } else {
            // TODO: handle unsupported type
            throw new Error('FieldError: type is not "string", "int" or "float"');
        }
    }

    /**
     * Gets the dataset info with the subsets.
     * @returns {Object} The object containing the dataset and subset info.
     */
    getDatasetInfo() {
        let self = this;
        // get all subsets
        let { subsets } = self.getSubsetInfo();
        let { methods } = self.getMethodInfo();

        // subset ids used in the dataset info
        let subsetIds = subsets.map(set => set.id);
        // prepare response object
        let jsonResults = {
            datasets: {
                id: self.params.datasetId,
                label: self.params.label,
                description: self.params.description,
                created: self.params.created,
                numberOfDocuments: self.base.store('Dataset').length,
                hasSubsets: subsetIds
            },
            subsets,
            methods
        };
        // returns
        return jsonResults;
    }

    /**
     * Gets information about the subsets in the database.
     * @returns {Object} An array of subset representation objects.
     */
    getSubsetInfo(id) {
        let self = this;
        // get database subsets
        let subsets = self.base.store('Subsets');
        let setObj = { subsets: null };
        // if id is a number
        if (!isNaN(parseFloat(id))) {
            // validate id
            if (id < 0 || subsets.length <= id) {
                // TODO: handle this error
                return null;
            }
            // get one subset and format it
            let set = subsets[id];
            setObj.subsets = self._formatSubsetInfo(set);
        } else {
            setObj.subsets = subsets.allRecords
                .map(rec => self._formatSubsetInfo(rec));
        }
        // return the subsets
        return setObj;
    }

    /**
     * Creates a subset record in the database.
     * @param {Object} subset - The subset to store.
     * @param {String} subset.label - The label of the subset.
     * @param {String} [subset.description] - The subset description.
     * @param {Number} subset.resultedIn - The id of the method that created the subset.
     * @param {Number[]} subset.documents - Array of document ids the subset contains.
     */
    createSubset(subset) {
        // TODO: log activity
        let self = this;
        // create subset record
        let qSubset = {
            label: subset.label,
            description: subset.description
        };
        // get method that created the subset
        let subsetId = self.base.store('Subsets').push(qSubset);
        let method = self.base.store('Methods')[subset.resultedIn];

        if (method) {
            // add join to method
            self.base.store('Subsets')[subsetId].$addJoin('resultedIn', method);
        }

        // add joins to documents/elements
        for (let documentId of subset.documents) {
            let document = self.base.store('Dataset')[documentId];
            if (document) { self.base.store('Subsets')[subsetId].$addJoin('hasElements', document); }
        }
        // return id of created subset
        return { subsets: { id: subsetId } };
    }

    /**
     * Gets documents that are part of the subset.
     * @param {Number} id - Subset id.
     * @param {Object} [query] - Query for retrieving documents.
     * @param {Number} [query.limit=10] - The number of documents it retrieves.
     * @param {Number} [query.offset=0] - The retrieval starting point.
     * @param {Number} [query.page] - The page number based on the limit.
     * @param {Object} [query.sort] - The sort parameters.
     * @param {String} query.sort.fieldName - The field by which the sorting is done.
     * @param {String} [query.sort.sortType] - The flag specifiying is sort is done. Possible: `asc` or `desc`.
     * @returns {Object} The object containing the documents and it's metadata.
     */
    getSubsetDocuments(id, query) {
        // TODO: log activity
        let self = this;
        // get database subsets
        let subsets = self.base.store('Subsets');
        if (id < 0 || subsets.length <= id) {
            // TODO: handle this error
            return null;
        }
        // prepare the query parameters
        let offset = query.offset ? query.offset : 0;
        let limit = query.limit ? query.limit : 10;
        // if page exists, modify offset
        if (query.page) {
            offset = (query.page-1)*limit;
        }
        // get page number
        let page = Math.floor(offset/limit) + 1;

        // prepare qminer query
        let qmQuery = {
            $join: {
                $name: 'hasElements',
                $query: {
                    $from: 'Subsets',
                    $id: id
                }
            }
        };

        // add sorting to the query
        if (query.sort) {
            // TODO: check if sort object has expected schema
            const ascFlag = query.sort.sortType === 'desc' ? -1 : 1;
            const field = query.sort.field;
            // set sort to the query
            qmQuery.$sort = { };
            qmQuery.$sort[field] = ascFlag;
        }

        // TODO: allow filtering documents

        // get the subset documents
        let subsetDocuments = self.base.search(qmQuery);

        // prepare field metadata
        let fields = self.base.store('Dataset').fields
            .map(field => {
                let sortType = null;
                // if the documents were sorted by the field
                if (query.sort && query.sort.field === field.name) {
                    sortType = query.sort.sortType;
                }
                // return field metadata
                return { name: field.name, type: field.type, sortType };
            });

        // prepare objects
        let setObj = {
            documents: null,
            meta: {
                fields,
                pagination: {
                    page,
                    limit,
                    documentCount: subsetDocuments.length
                }
            }
        };
        // truncate the documents using the query
        subsetDocuments.trunc(limit, offset);

        // format the documents
        setObj.documents = subsetDocuments.map(rec => self._formatDocumentInfo(rec));

        // return documents and metadata
        return setObj;
    }

    /**
     * Gets information about the methods in the database.
     * @returns {Object} An object containing the array of method representation objects.
     */
    getMethodInfo(id) {
        // TODO: log activity
        let self = this;
        // get database methods
        let methods = self.base.store('Methods');
        let methodObj = { methods: null };
        // if id is a number
        if (!isNaN(parseFloat(id))) {
            // validate id
            if (id < 0 || methods.length <= id) {
                // TODO: handle this error
                return null;
            }
            // get one method and format it
            let set = methods[id];
            methodObj.methods = self._formatMethodInfo(set);
        } else {
            methodObj.methods = methods.allRecords
                .map(rec => self._formatMethodInfo(rec));
        }
        // return the methods
        return methodObj;
    }

    /**
     * Creates a method record in the database.
     * @param {Object} method - The method to store.
     * @param {String} method.methodType - The type of the method.
     * @param {Object} method.parameters - The parameters of the method.
     * @param {Object} method.result - The result of the method.
     * @param {Number} method.appliedOn - The id of the subset the method was applied on.
     */
    createMethod(method) {
        // TODO: log activity

        let self = this;
        // prepare method object
        let qMethod = {
            type: method.methodType,
            parameters: method.parameters,
            result: method.result
        };
        // get subset on which the method was used
        let subset = self.base.store('Subsets')[method.appliedOn];
        if (subset) {
            let methodId = self.base.store('Methods').push(qMethod);
            self.base.store('Methods')[methodId].$addJoin('appliedOn', subset);
            return { methods: { id: methodId } };
        } else {
            throw new Error(`No subset with id=${method.appliedOn}`);
        }

    }

    /**
     * Formats the subset record.
     * @param {Object} rec - The subset record.
     * @returns {Object} The subset json representation.
     */
    _formatSubsetInfo(rec) {
        return {
            id: rec.$id,
            type: 'subsets',
            label: rec.label,
            description: rec.description,
            resultedIn: rec.resultedIn ? rec.resultedIn.$id : null,
            usedBy: !rec.usedBy.empty ? rec.usedBy.map(method => method.$id) : null,
            documentCount: !rec.hasElements.empty ? rec.hasElements.length : null
        };
    }

    /**
     * Formats the document record.
     * @param {Object} rec - The document record.
     * @returns {Object} The document json representation.
     */
    _formatDocumentInfo(rec) {
        return {
            id: rec.$id,
            type: 'documents',
            subsets: !rec.inSubsets.empty ? rec.inSubsets.map(subset => subset.$id) : null,
            values: rec.toJSON(false, false, false)
        };
    }

    /**
     * Formats the method record.
     * @param {Object} rec - The method record.
     * @returns {Object} The method json representation.
     */
    _formatMethodInfo(rec) {
        return {
            id: rec.$id,
            type: 'methods',
            methodType: rec.type,
            parameters: rec.parameters,
            result: rec.result,
            produced: !rec.produced.empty ? rec.produced.map(subset => subset.$id) : null,
            appliedOn: !rec.appliedOn.empty ? rec.appliedOn.map(subset => subset.$id) : null
        };
    }

}

module.exports = BaseDataset;