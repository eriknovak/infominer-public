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
        const inFields = fields.filter(field => field.included)
            .map(field => ({ name: field.name, type: field.type }));
        // TODO: check fields schema

        // replace the schema fields
        schema[0].fields = inFields;
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
            let fValues = newLine.trim().split('|');
            // prepare and push record to dataset
            let rec = self._prepareRecord(fValues, fields);
            let recId = self.base.store('Dataset').push(rec);
            // get record and check for join with root subset
            if (self.base.store('Dataset')[recId].inSubsets.empty) {
                self.base.store('Dataset')[recId].$addJoin('inSubsets', self.base.store('Subsets')[0]);
            }
        }
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
                // record is part of a subset (whole dataset)
                if (self.base.store('Subsets').empty) {
                    let data = {
                        label: 'root',
                        description: 'The root subset. Contains all records of dataset.'
                    };
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

    /**
     * Gets the dataset info with the subsets.
     * @returns {Object} The object containing the dataset and subset info.
     */
    getDatasetInfo() {
        let self = this;
        // get all subsets
        let { subsets } = self.getSubsetInfo();
        // subset ids used in the dataset info
        let subsetIds = subsets.map(set => set.id);
        let jsonResults = {
            datasets: {
                id: self.params.datasetId,
                label: self.params.label,
                description: self.params.description,
                created: self.params.created,
                numberOfDocuments: self.base.store('Dataset').length,
                hasSubsets: subsetIds
            },
            subsets
        };
        // returns
        return jsonResults;
    }

    /**
     * Gets information about the subsets in the database.
     * @returns {Object[]} An array of subset representation objects.
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

    getSubsetDocuments(id, query) {
        let self = this;
        // get database subsets
        let subsets = self.base.store('Subsets');
        let setObj = { documents: null };
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

        // get the subset documents limited by
        let subsetDocuments = subsets[id].hasElements;
        // TODO: allow filtering documents

        // truncate the documents using the query
        subsetDocuments.trunc(limit, offset);

        // get the documents
        setObj.documents = subsetDocuments.map(rec => self._formatDocumentInfo(rec));
        return setObj;
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
            resultedIn: rec.resultedIn ? rec.resultedIn.id : null,
            usedBy: !rec.usedBy.empty ? rec.usedBy.map(method => method.id) : null,
            numberOfElements: rec.hasElements.length
        };
    }

    /**
     * Formats the document record.
     * @param {Object} rec - The document record.
     * @returns {Object} The document json representation.
     */
    _formatDocumentInfo(rec) {
        let self = this;
        return {
            id: rec.$id,
            type: 'documents',
            fields: self.base.store('Dataset').fields
                .map(field => ({ name: field.name, type: field.type })),
            values: rec.toJSON(false, false, false)
        };
    }

}

module.exports = BaseDataset;