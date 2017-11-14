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
        self.isOpen = true;
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
        this.isOpen = false;
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
        const inFields = fields.filter(field => field.included)
            .map(field => ({ name: field.name, type: field.type }));
        // TODO: check fields schema

        // replace the schema fields
        schema[0].fields = inFields;
        return schema;
    }

    /**
     * Pushes each row of the document to database.
     * @param {Object} file - File blob.
     * @param {field_instance[]} fields - Dataset fields.
     * @param {Object} dataset - Dataset information.
     *
     */
    pushDocsToBase(file, fields, dataset) {
        let self = this;
        // check required parameters
        if (!fields) { throw new Error('FieldError: fields must be defined'); }
        if (!file) { throw new Error('FieldError: file must be defined'); }

        // read file and skip first line
        let fileIn = qm.fs.openRead(file.filePath);
        fileIn.readLine(); // skip header line

        // iterate until end of file
        while (!fileIn.eof) {
            // get new row and its values
            let newLine = fileIn.readLine();
            let fValues = newLine.trim().split('|');
            // prepare and push record to dataset
            let rec = self._prepareRecord(fValues, fields, dataset);
            self.base.store('Dataset').push(rec);
        }
    }

    /**
     * Creates an object suitable for database.
     * @param {String[]} values - An array of field values.
     * @param {field_instance[]} fields - An array of field objects.
     * @param {Object} [dataset] - Info about the dataset.
     * @param {Object} [dataset.name] - Name of the dataset.
     * @returns {Object} A record prepared for pushing to database.
     */
    _prepareRecord(values, fields, dataset) {
        let self = this;
        // prepare record placeholder
        let rec = { };
        // iterate through fields
        for (let i = 0; i < fields.length; i++) {
            // if the field is included in the database
            if (fields[i].included) {
                rec[fields[i].name] = self._parseFValue(values[i], fields[i].type);
                if (dataset) {
                    // record is part of a subset (whole dataset)
                    let data = { };
                    if (dataset.label) { data.label = dataset.label; }
                    if (dataset.description) { data.description = dataset.description; }
                    // if data contains any fields
                    if (Object.keys(data).length > 0) { rec.inSubsets = [data]; }
                }
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
}

module.exports = BaseDataset;