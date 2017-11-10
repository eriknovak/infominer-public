// external modules
const qm = require('qminer');
// internal modules
const fileManager = require('./fileManager');

/**
 * The Dataset base container.
 */
class BaseDataset {

    /**
     * Constructing the dataset base.
     * @param {Object} params - The construction parameters.
     * @param {String} params.data_folder - Path to data folder.
     * @param {String} params.user - The user accessing the dataset.
     * @param {String} params.db - The database name.
     * @param {String} params.mode - The mode in which the base is opened. Possible: 'open' and 'createClean'.
     * @param {Object[]} [fields] - The fields of the dataset. Must have when `params.init.mode='createClean'`.
     *
     */
    constructor(params, fields) {
        let self = this;

        self.params = params;
        // TODO: handle parameter values
        if (!self.params.user) { throw new Error('FieldError: params.user must be defined'); }
        if (!self.params.db) { throw new Error('FieldError: params.db must be defined'); }
        if (!self.params.mode) { throw new Error('FieldError: params.init.mode must be defined'); }

        if (!self.params.data_folder) { self.params.data_folder = `${__dirname}/../../../data`; }

        // path to database folder
        self.dbPath = `${self.params.data_folder}/${self.params.user}/${self.params.db}`;

        // loads the base
        self._loadBase(fields);
    }

    /**
     * Loads the base.
     * @param {Object[]} [fields] - The fields of the dataset. Must have when `params.init.mode='createClean'`.
     * @private
     */
    _loadBase(fields) {
        let self = this;

        if (self.params.mode === 'createClean') {
            // check required parameters
            if (!fields) { throw new Error('FieldError: fields must be defined'); }

            // create dbPath folders
            fileManager.createDirectoryPath(self.dbPath);

            // get the schema for database
            const schema = self._prepareSchema(fields);

            // create new database
            self.base = new qm.Base({
                mode: self.params.mode,
                dbPath: self.dbPath,
                schema
            });

        } else if (self.params.mode === 'open') {
            // open database and prepare it for analysis
            self.base = new qm.Base({ mode: self.params.mode, dbPath: self.dbPath });
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
     * Prepare database schema.
     * @param {Object[]} fields - Array of dataset fields.
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
     */
    pushDocsToBase(file, fields) {
        let self = this;
        // check required parameters
        if (!fields) { throw new Error('FieldError: fields must be defined'); }
        if (!file) { throw new Error('FieldError: file must be defined'); }

        // prepare file buffer and parameters
        let buffer = Buffer.from(file.buffer, file.encoding);
        let offset = 0;

        // iterate until end of file
        while (offset < buffer.length) {
            // get index of newline
            let newLine = buffer.indexOf('\n', offset);
            // if there is no new lines - get length of buffer
            if (newLine == -1) { newLine = buffer.length; }
            // get and separate row values
            let fValues = buffer.slice(offset, newLine).toString().trim().split('|');
            if (offset > 0) {
                // prepare and push record to dataset
                let rec = self._prepareRecord(fValues, fields);
                self.base.store('Dataset').push(rec);
            }
            // update offset
            offset = newLine + 1;
        }
    }

    /**
     * Creates an object suitable for database.
     * @param {String[]} values - An array of field values.
     * @param {Object[]} fields - An array of field objects.
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
}

module.exports = BaseDataset;