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
     * @param {Object} params.init - The initialization parameters.
     * @param {String} params.init.mode - The mode in which the base is opened. Possible: 'open' and 'createClean'.
     * @param {Object[]} [params.init.fields] - The fields of the dataset. Must have when `params.init.mode='createClean'`.
     * @param {Object[]} [params.init.file] - The file blob. Must have when `params.init.mode='createClean'`.
     *
     */
    constructor(params) {
        let self = this;

        self.params = params;
        // TODO: handle parameter values
        if (!self.params.user) { throw new Error('FieldError: params.user must be defined'); }
        if (!self.params.db) { throw new Error('FieldError: params.db must be defined'); }
        if (!self.params.init) { throw new Error('FieldError: params.init must be defined'); }
        if (!self.params.init.mode) { throw new Error('FieldError: params.init.mode must be defined'); }

        if (!self.params.data_folder) { self.params.data_folder = `${__dirname}/../../../data`; }

        // path to database folder
        self.dbPath = `${self.params.data_folder}/${self.params.user}/${self.params.db}`;

        // loads the base
        self._loadBase();
    }

    /**
     * Loads the base.
     * @private
     */
    _loadBase() {
        let self = this;

        if (self.params.init.mode === 'createClean') {
            // check required parameters
            if (!self.params.init.fields) { throw new Error('FieldError: params.init.fields must be defined'); }
            if (!self.params.init.file) { throw new Error('FieldError: params.init.file must be defined'); }

            // create dbPath folders
            fileManager.createDirectoryPath(self.dbPath);

            // get the schema for database
            const schema = self._prepareSchema(self.params.init.fields);

            // create new database
            self.base = new qm.Base({
                mode: self.params.init.mode,
                dbPath: self.dbPath,
                schema
            });

            // fill the database with documents
            self._pushDocsToBase(self.params.init.file, self.params.init.fields);

        } else if (self.params.init.mode === 'open') {
            // open database and prepare it for analysis
            self.base = new qm.Base({ mode: self.params.init.mode, dbPath: self.dbPath });
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
    _pushDocsToBase(file, fields) {
        let self = this;
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