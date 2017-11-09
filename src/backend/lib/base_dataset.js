// external modules
const qm = require('qminer');

/**
 * The Dataset base container.
 */
class BaseDataset {

    /**
     * Constructing the dataset base.
     * @param {Object} params - The construction parameters.
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

        // path to database folder
        self.dbPath = `${__dirname}/../../../data/${self.params.user}/${self.params.db}`;

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

            // get the schema for database
            const schema = self._prepareSchema(self.params.init.fields);

            // create new database
            self.base = new qm.Base({
                mode: self.params.init.mode,
                dbPath,
                schema
            });

            // fill the database with documents
            self._pushDocsToBase(self.params.init.file);

        } else if (self.params.init.mode === 'open') {
            // open database and prepare it for analysis
            self.base = new qm.Base({ mode: self.params.init.mode, dbPath });
        } else {
            // TODO: handle non-supported mode
            throw new Error('FieldError: params.init.mode must be "createClean", "open" or "openReadOnly"');
        }
    }

    /**
     * Close the database.
     */
    _closeBase() {
        self.base.close();
    }

    /**
     * Prepare database schema.
     * @param {Object[]} fields - Array of dataset fields.
     * @return {Object[]} Database schema for given dataset.
     */
    _prepareSchema(fields) {
        let schema = require(`${__dirname}/../config/schema.json`);
        // TODO: check fields schema

        // replace the schema fields
        schema[0].fields = fields;
        return schema;
    }

    /**
     * Pushes each row of the document to database.
     * @param {Object} file - File blob.
     */
    _pushDocsToBase(file) {

    }

}