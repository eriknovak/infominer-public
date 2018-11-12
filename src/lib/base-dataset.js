// external modules
const qm = require('qminer');
const path = require('path');
// internal modules
const fileManager = require('./file-manager');

// the formatter for the output requests
let formatter = require('./base-util/formatter');

/**
 * The dataset field used in QMiner database.
 * @typedef field-instance
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
     * @param {String} params.mode - The mode in which the base is opened.
     * Possible: 'open' and 'createClean'.
     * @param {field-instance[]} [fields] - The fields of the dataset. Must have
     * when `params.mode='createClean'`.
     * @constructor
     */
    constructor(params, SubsetsManager, ModelsManager, validator, fields) {
        let self = this;

        // store validator
        self._validator = validator;
        // validate constructor parameters
        if (validator.validateSchema(params, validator.schemas.constructorParams) &&
            validator.validateSchema(fields, validator.schemas.constructorFields)) {
            // continue with database initialization
            self.params = params;
            self._subsetsManager = new SubsetsManager(formatter, validator);
            self._modelsManager  = new ModelsManager(formatter, validator);

            // loads the base
            self._loadBase(fields);

        } else {
            // constructor parameters mismatch - something went wrong
            console.error('Constructor parameters are not in specified schema');
            return {
                errors: {
                    msg: 'Constructor parameters are not in specified schema'
                }
            };

        }
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

            // validate first item in schema - the one created by the user
            if (self._validator.validateSchema(schema[0], self._validator.schemas.constructorStore)) {
                // schema is in valid form - continue with database creation
                self.base = new qm.Base({
                    mode: self.params.mode,
                    dbPath: self.params.dbPath,
                    schema
                });
            } else {
                // schema parameters mismatch - something went wrong
                console.error('Schema parameters are not in specified form');
                return {
                    errors: {
                        msg: '_loadBase: Schema parameters are not in specified form'
                    }
                };
            }
        } else if (self.params.mode === 'open') {
            // open database and prepare it for analysis
            self.base = new qm.Base({ mode: self.params.mode, dbPath: self.params.dbPath });
            self.fields = self._getDatasetFields();
        } else {
            // TODO: handle non-supported mode
            console.error('Constructor parameters are not in specified schema');
            return {
                errors: {
                    msg: '_loadBase: self.params.mode must be "createClean" or "open"'
                }
            };
        }
    }

    /**
     * Prepare database schema.
     * @param {field_instance[]} fields - Array of dataset fields.
     * @return {Object[]} Database schema for given dataset.
     * @private
     */
    _prepareSchema(fields) {
        let schema = require(path.join(__dirname, '../schemas/schema.json'));
        // filter out included fields
        const includedFields = fields.filter(field => field.included);

        // prepare the dataset fields
        const datasetFields = includedFields.map(field => ({
            name: field.name,
            type: field.type,
            null: true
        }));

        // replace the schema fields
        schema[0].fields = datasetFields;

        // add dataset schema keys
        let keys = [ ];
        for (let field of includedFields) {
            // string fields are used for keys
            if (field.type === 'string') {
                keys.push({ field: field.name, type: 'text_position' });
            } else if (field.type === 'float' || field.type === 'datetime') {
                keys.push({ field: field.name, type: 'linear' });
            } else if (field.type === 'string_v') {
                keys.push({ field: field.name, type: 'value' });
            }
        }

        // add keys to the schema
        if (keys.length) { schema[0].keys = keys; }

        return schema;
    }

    /**
     * Pushes each row of the document to database.
     * @param {String} filePath - File path.
     * @param {String} delimiter - The delimiter used to create the dataset.
     * @param {field_instance[]} fields - Dataset fields.
     * @returns {Object} Object containing the subset id.
     */
    pushDocuments(filePath, delimiter, fields) {
        let self = this;
        // check required parameters
        if (!filePath) { throw new Error('FieldError: filePath must be defined'); }
        if (!fields) { throw new Error('FieldError: fields must be defined'); }


        // create the root subset
        let subset = {
            label: 'root',
            description: 'The root subset. Contains all records of dataset.',
        };
        let { subsets: { id: subsetId } } = self.createSubset(subset);

        // read file and skip first line
        let fileIn = qm.fs.openRead(filePath); fileIn.readLine();

        // iterate until end of file
        while (!fileIn.eof) {
            // get new row and its values
            let line = fileIn.readLine();
            // skip empty lines
            if (line.trim() === '') { continue; }
            let values = line.trim().split(delimiter);
            // prepare and push record to dataset
            let rec = { };
            // iterate through fields
            for (let i = 0; i < fields.length; i++) {
                // if the field is included in the database
                if (fields[i].included) {
                    rec[fields[i].name] = values[i] ? self._parseFieldValue(values[i], fields[i].type) : null;
                }
            }
            let recId = self.base.store('Dataset').push(rec);
            self.base.store('Dataset')[recId].$addJoin('inSubsets', self.base.store('Subsets')[subsetId]);
        }
        // close the input stream
        fileIn.close();

        // set dataset fields - and aggregates
        self.fields = self._getDatasetFields();

        // return subset object
        return { subsets: { id: subsetId } };
    }

    /**
     * Parses the value in the desired type.
     * @param {String} value - The string in consideration.
     * @param {String} type - The type in which we want to parse.
     * @returns {String|Number} The value parsed in the desired type.
     */
    _parseFieldValue(value, type) {
        switch (type) {
            case 'string':
                return value === '' ? null : value;
            case 'float':
                return parseFloat(value);
            case 'string_v':
                return value.split(/[\\\/]/g);
            case 'datetime':
                return new Date(value).toISOString();
            default:
                throw new Error('FieldError: type is not "string", "float", "string_v" or "datetime"');
        }
    }

    _getDatasetFields() {
        let fields = this.base.store('Dataset').fields;
        // prepare full dataset
        let dataset = this.base.store('Dataset').allRecords;
        // set aggregate types for each field
        fields.forEach(field => {
            // TODO: add editable configuration
            // for showing fields in tables
            field.show = field.id < 4;
            if (field.type === 'float') {
                // aggregate field of type float with histogram
                field.aggregate = 'histogram';
                // get the min and max value found within the field
                let aggregate = dataset.aggr({
                    name: `sample_${field.name}`,
                    field: field.name,
                    type: field.aggregate
                });
                // store the aggregate values
                const { min, max } = aggregate;
                field.metadata = { min, max };

            } else if (field.type === 'string') {
                field.aggregate = 'keywords';
            } else if (field.type === 'string_v') {
                // categories should be aggregated as hierarchy
                field.aggregate = 'hierarchy';
            } else if (field.type === 'datetime') {
                field.aggregate = 'timeline';
            }
        });
        // return the fields with aggregates
        return fields;
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



    /**********************************
     * Dataset-related Functions
     *********************************/

    /**
     * Gets the dataset info with the subsets.
     * @returns {Object} The object containing the dataset and subset info.
     */
    getDataset() {
        let self = this;
        // get all subsets
        let { subsets } = self.getSubset();
        let { methods } = self.getMethod();

        // prepare response object
        let dataset = {
            datasets: self._formatDataset(),
            subsets,
            methods
        };
        // returns
        return dataset;
    }

    /**
     * Set the dataset info.
     * @returns {Object} The dataset data info.
     */
    editDataset(dataset) {
        let self = this;

        // validate input parameter schema
        if (!self._validator.validateSchema(dataset, self._validator.schemas.editDatasetSchema)) {
            // input parameter is not in correct format - return Error
            return {
                error: {
                    msg: 'Edit parameters are in incorrect format'
                }
            };
        }

        // update dataset label
        if (typeof dataset.label === 'string') {
            self.params.label = dataset.label;
        }
        // update dataset description
        if (typeof dataset.description === 'string') {
            self.params.description = dataset.description;
        }

        // return the new dataset info
        return { datasets: self._formatDataset() };
    }

    /**
     * Format the dataset info.
     * @returns {Object} The dataset json representation.
     * @private
     */
    _formatDataset() {
        let self = this;
        //  get subset info
        let { subsets } = self.getSubset();
        let { methods } = self.getMethod();
        // subset ids used in the dataset info
        let subsetIds = subsets.map(rec => rec.id);
        let methodIds = methods.map(rec => rec.id);

        return {
            id: self.params.datasetId,
            label: self.params.label,
            description: self.params.description,
            created: self.params.created,
            numberOfDocuments: self.base.store('Dataset').length,
            numberOfSubsets: self.base.store('Subsets').length,
            numberOfMethods: self.base.store('Methods').length,
            hasSubsets: subsetIds,
            hasMethods: methodIds,
            fields: self.fields
        };
    }



    /**********************************
     * Subset-related Functions
     *********************************/

    /**
     * Creates a subset record in the database.
     * @param {Object} subset - The subset to store.
     * @param {String} subset.label - The label of the subset.
     * @param {String} [subset.description] - The subset description.
     * @param {Number} subset.resultedIn - The id of the method that created the subset.
     * @param {Number[]} subset.documents - Array of document ids the subset contains.
     */
    createSubset(subset) {
        let self = this;
        return self._subsetsManager.createSubset(self.base, subset);
    }

    /**
     * Gets information about the subsets in the database.
     * @param {Number} id - The id of the subset.
     * @returns {Object} An array of subset representation objects.
     */
    getSubset(id) {
        let self = this;
        return self._subsetsManager.getSubset(self.base, id);
    }

    /**
     * Creates a subset record in the database.
     * @param {Object} subset - The subset information.
     * @param {String} subset.label - The new subset label.
     * @param {String} [subset.description] - The new subset description.
     */
    editSubset(subset) {
        let self = this;
        return self._subsetsManager.updateSubset(self.base, subset);
    }

    /**
     * Sets the deleted flag of the subset and its joins to treu.
     * @param {String | Number} id - The id of the subset.
     */
    deleteSubset(id) {
        let self = this;
        return self._subsetsManager.deleteSubset(self.base, id,
            self._modelsManager.deleteModel.bind(self._modelsManager));
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
        let self = this;
        return self._subsetsManager.getDocuments(self.base, id, query,
            self._modelsManager._aggregateByField.bind(self._modelsManager),
            self.fields);
    }



    /**********************************
     * Method-related Functions
     *********************************/

    /**
     * Creates a method record in the database.
     * @param {Object} method - The method to store.
     * @param {String} method.type - The type of the method.
     * @param {Object} method.parameters - The parameters of the method.
     * @param {Object} method.result - The result of the method.
     * @param {Number} method.appliedOn - The id of the subset the method was applied on.
     */
    createMethod(method) {
        let self = this;
        return self._modelsManager.createModel(self.base, method, self.fields,
            self._subsetsManager.createSubset.bind(self._subsetsManager));
    }

    /**
     * Gets information about the method in the database.
     * @param {String | Number} id - The id of the method.
     * @returns {Object} An object containing the array of method representation objects.
     */
    getMethod(id) {
        let self = this;
        return self._modelsManager.getModel(self.base, id);
    }

    /**
     * Creates a method record in the database.
     * @param {Object} method - The method to store.
     * @param {String} method.type - The type of the method.
     * @param {Object} method.parameters - The parameters of the method.
     * @param {Object} method.result - The result of the method.
     * @param {Number} method.appliedOn - The id of the subset the method was applied on.
     */
    editMethod(method) {
        let self = this;
        return self._modelsManager.updateModel(self.base, method);
    }

    /**
     * Sets the deleted flag of the method and its joins to true.
     * @param {Number | String} id - The id of the method.
     */
    deleteMethod(id) {
        let self = this;
        return self._modelsManager.deleteModel(self.base, id,
            self._subsetsManager.deleteSubset.bind(self._subsetsManager));
    }

    /**
     * Calculates the aggregates on the subset.
     * @param {Number} id - The subset id.
     * @returns {Object} The subset aggregate method.
     */
    aggregateSubset(id) {
        let self = this;
        return self._modelsManager.aggregateSubset(self.base, id, self.fields);
    }

    /**
     * Gets information about the method in the database.
     * @param {String} hash - The hash of the method.
     * @returns {Object} An object containing the status of the method.
     */
    getMethodStatus(hash) {
        let self = this;
        return self._modelsManager.getModelStatus(hash);
    }

}

module.exports = BaseDataset;
