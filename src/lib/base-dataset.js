// external modules
const qm = require('qminer');
const path = require('path');
// internal modules
const fileManager = require('./file-manager');

const validator = require('./validator')({
    // dataset schemas
    constructorParams: require('../schemas/base_dataset/constructorParams'),
    constructorFields: require('../schemas/base_dataset/constructorFields'),
    constructorStore:  require('../schemas/base_dataset/constructorStore'),
    editDatasetSchema: require('../schemas/base_dataset/editDatasetSchema'),

    // subset schemas
    getSubsetDocuments: require('../schemas/base_dataset/getSubsetDocuments'),

    // methods schemas
    featureSchema:      require('../schemas/base_dataset/featuresSchema'),
    methodKMeansParams: require('../schemas/base_dataset/methodKMeansParams'),
});

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
     * @param {field_instance[]} [fields] - The fields of the dataset. Must have when `params.mode='createClean'`.
     * @constructor
     */
    constructor(params, fields) {
        let self = this;

        // validate constructor parameters
        if (validator.validateSchema(params, validator.schemas.constructorParams) &&
            validator.validateSchema(fields, validator.schemas.constructorFields)) {
            // constructor parameters are valid - continue with database initialization
            self.params = params;
            // loads the base
            self._loadBase(fields);
        } else {
            // constructor parameters mismatch - something went wrong
            console.error('Constructor parameters are not in specified schema');
            return { errors: { messages: 'Constructor parameters are not in specified schema' } };

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
            if (validator.validateSchema(schema[0], validator.schemas.constructorStore)) {
                // schema is in valid form - continue with database creation
                self.base = new qm.Base({
                    mode: self.params.mode,
                    dbPath: self.params.dbPath,
                    schema
                });
            } else {
                // schema parameters mismatch - something went wrong
                console.error('Schema parameters are not in specified form');
                return { errors: { messages: '_loadBase: Schema parameters are not in specified form' } };
            }
        } else if (self.params.mode === 'open') {
            // open database and prepare it for analysis
            self.base = new qm.Base({ mode: self.params.mode, dbPath: self.params.dbPath });
        } else {
            // TODO: handle non-supported mode
            console.error('Constructor parameters are not in specified schema');
            return { errors: { messages: '_loadBase: self.params.mode must be "createClean" or "open"' } };
        }
        self.fields = self._getDatasetFields();
    }

    _getDatasetFields() {
        let fields = this.base.store('Dataset').fields;

        // set aggregate types for each field
        fields.forEach(field => {
            if (field.type === 'float') {
                field.aggregate = 'histogram';
            } else if (field.type === 'string') {
                // on a sample check how many different values
                // there is for that field
                let sampleSet = this.base.store('Dataset').allRecords;
                let aggregate = sampleSet.aggr({ name: `sample_${field.name}`, field: field.name, type: 'count' });
                field.aggregate = aggregate && aggregate.values.length < Math.min(15, sampleSet.length) ? 'count' : 'keywords';
            }
        });
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

    /**
     * Prepare database schema.
     * @param {field_instance[]} fields - Array of dataset fields.
     * @return {Object[]} Database schema for given dataset.
     * @private
     */
    _prepareSchema(fields) {
        let schema = require(path.join(__dirname, '/../schemas/schema.json'));
        // filter out included fields
        const inFields = fields.filter(field => field.included);

        // prepare the dataset fields
        const datasetFields = inFields.map(field => ({ name: field.name, type: field.type, null: true }));

        // replace the schema fields
        schema[0].fields = datasetFields;

        // add dataset schema keys
        let datasetKeys = [ ];
        for (let field of inFields) {
            // string fields are used for keys
            if (field.type === 'string') {
                datasetKeys.push({ field: field.name, type: 'text_position' });
            } else if (field.type === 'float') {
                datasetKeys.push({ field: field.name, type: 'linear' });
            }
        }

        // add keys to the schema
        if (datasetKeys.length) { schema[0].keys = datasetKeys; }

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

        // read file and skip first line
        let fileIn = qm.fs.openRead(filePath);
        fileIn.readLine(); // skip header line

        // iterate until end of file
        while (!fileIn.eof) {
            // get new row and its values
            let newLine = fileIn.readLine();
            // skip empty lines
            if (newLine.trim() === '') { continue; }

            let fValues = newLine.trim().split(delimiter);
            // prepare and push record to dataset
            let rec = self._prepareRecord(fValues, fields);
            self.base.store('Dataset').push(rec);
        }
        // close the input stream - enable file manipulation
        fileIn.close();

        // set dataset fields - and aggregates
        self.fields = self._getDatasetFields();

        // create the root subset
        let subset = {
            label: 'root',
            description: 'The root subset. Contains all records of dataset.',
            documents: self.base.store('Dataset').allRecords.map(rec => rec.$id)
        };

        // return subset object
        return self.createSubset(subset);
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
                rec[fields[i].name] = self._parseFieldValue(values[i], fields[i].type);
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
    _parseFieldValue(value, type) {
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
    getDatasetInformation() {
        let self = this;
        // get all subsets
        let { subsets } = self.getSubsetInformation();
        let { methods } = self.getMethodInformation();

        // prepare response object
        let jsonResults = {
            datasets: self._formatDatasetInformation(),
            subsets,
            methods
        };
        // returns
        return jsonResults;
    }

    /**
     * Set the dataset info.
     * @returns {Object} The dataset data info.
     */
    editDatasetInformation(datasetInformation) {
        let self = this;

        // validate input parameter schema
        if (!validator.validateSchema(datasetInformation, validator.schemas.editDatasetSchema)) {
            // input parameter is not in correct format - return Error
            return { error: { message: 'Edit parameters are in incorrect format' } };
        }

        if (typeof datasetInformation.label === 'string') {
            // update dataset label
            self.params.label = datasetInformation.label;
        }
        if (typeof datasetInformation.description === 'string') {
            // update dataset description
            self.params.description = datasetInformation.description;
        }

        // return the new dataset info
        return { datasets: self._formatDatasetInformation() };
    }

    /**
     * Gets information about the subsets in the database.
     * @returns {Object} An array of subset representation objects.
     */
    getSubsetInformation(id) {
        let self = this;
        // get database subsets
        let subsets = self.base.store('Subsets');
        let setObj = { subsets: null };
        // if id is a number
        if (!isNaN(parseFloat(id))) {
            // get one subset and format it
            let set = subsets[id];
            if (!set) { return null; }
            setObj.subsets = self._formatSubsetInformation(set);
            // prepare methods handler
            setObj.methods = [ ];
            if (set.resultedIn) {
                // set the resulted in method
                let resultedInMethod = [self._formatMethodInformation(set.resultedIn)];
                setObj.methods = setObj.methods.concat(resultedInMethod);
            }
            if (set.usedBy.length) {
                // get methods that used the subset
                let usedByMethods = set.usedBy.map(method => self._formatMethodInformation(method));
                setObj.methods = setObj.methods.concat(usedByMethods);
            }
            // remove the 'methods' property if none were given
            if (!setObj.methods.length) { delete setObj.methods; }

        } else {
            setObj.subsets = subsets.allRecords
                .map(rec => self._formatSubsetInformation(rec));
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

        if(subset.meta) {
            // use metadata to determine the documents in the subset
            if (!isNaN(parseFloat(subset.meta.clusterId))) {
                // subset contains documents that were in the cluster
                let clusterId = subset.meta.clusterId;
                subset.documents = method.result.clusters[clusterId].docIds;
                // update cluster information
                let clusters = method.result.clusters;
                clusters[clusterId].subsetCreated = true;
                clusters[clusterId].subsetId = subsetId;
                clusters[clusterId].clusterLabel = qSubset.label;
                method.result = { clusters };
            }
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
     * Creates a subset record in the database.
     * @param {Object} subsetInfo - The subset information.
     * @param {String} subsetInfo.label - The new subset label.
     * @param {String} [subsetInfo.description] - The new subset description.
     */
    editSubsetInformation(subsetInformation) {
        let self = this;
        // validate input parameter schema
        if (!validator.validateSchema(subsetInformation, validator.schemas.editDatasetSchema)) {
            // input parameter is not in correct format - return Error
            return { error: { message: 'Edit parameters are in incorrect format' } };
        }

        // get subset info and update state
        let subset = self.base.store('Subsets')[subsetInformation.subsetId];

        // update the subset label and description
        if (subsetInformation.label) {
            // update the subset label
            subset.label = subsetInformation.label;
        }
        if (subsetInformation.description || subsetInformation.description === null) {
            // update the subset description
            subset.description = subsetInformation.description;
        }

        // return the subset information
        return { subsets: self._formatSubsetInformation(subset) };

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
        // get database subsets
        let subsets = self.base.store('Subsets');
        if (id < 0 || subsets.length <= id) {
            // TODO: log error
            return { errors: { message: 'The subset id does not match with any existing subsets' } };
        }

        // validate query parameters
        if (!validator.validateSchema(query, validator.schemas.getSubsetDocuments)) {
            // query parameters does not match schema
            return { errors: { message: 'The query parameters for document retrieval are invalid' } };
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

        // add additional queries
        let queryParams = query.query;
        if (queryParams && queryParams.text) {
            qmQuery.$or = [];
            for (let field of queryParams.text.fields) {
                // add field and value to the query
                let fieldQuery = {};
                fieldQuery[field] = queryParams.text.keywords;
                qmQuery.$or.push(fieldQuery);
            }
        }

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
                    documentCount: subsetDocuments.length,
                },
                query: queryParams && queryParams.text ? queryParams : null
            }
        };
        // truncate the documents using the query
        subsetDocuments.trunc(limit, offset);

        // format the documents
        setObj.documents = subsetDocuments.map(rec => self._formatDocumentInformation(rec));

        // return documents and metadata
        return setObj;
    }

    /**
     * Gets information about the methods in the database.
     * @returns {Object} An object containing the array of method representation objects.
     */
    getMethodInformation(id) {
        // TODO: log activity
        let self = this;
        // get database methods
        let methods = self.base.store('Methods');
        let methodObj = { methods: null, meta: null };
        // if id is a number
        if (!isNaN(parseFloat(id))) {
            // validate id
            if (id < 0 || methods.length <= id) {
                // handle id missmatch
                return { errors: { message: 'The method id does not match with any existing methods' } };
            }
            // get one method and format it
            let set = methods[id];
            methodObj.methods = self._formatMethodInformation(set);
            // subset information
            methodObj.subsets = [ ];

            if (!set.appliedOn.empty) {
                // set the resulted in method
                let appliedOnSubsets = set.appliedOn.map(subset => self._formatSubsetInformation(subset));
                methodObj.subsets = methodObj.subsets.concat(appliedOnSubsets);
            }
            if (!set.produced.empty) {
                // get methods that used the subset
                let producedSubsets = set.produced.map(subset => self._formatSubsetInformation(subset));
                methodObj.subsets = methodObj.subsets.concat(producedSubsets);
            }
            // remove the 'methods' property if none were given
            if (!methodObj.subsets.length) { delete methodObj.subsets; }

        } else {
            methodObj.methods = methods.allRecords
                .map(rec => self._formatMethodInformation(rec));
        }
        // return the methods
        return methodObj;
    }

    /**
     * Creates a method record in the database.
     * @param {Object} method - The method to store.
     * @param {String} method.type - The type of the method.
     * @param {Object} method.parameters - The parameters of the method.
     * @param {Object} method.result - The result of the method.
     * @param {Number} method.appliedOn - The id of the subset the method was applied on.
     */
    createMethod(method) {
        // TODO: log activity
        let self = this;
        // prepare method object
        let queryMethod = {
            type:       method.type,
            parameters: method.parameters,
            result:     method.result
        };

        // get subset on which the method was used
        let subset = self.base.store('Subsets')[method.appliedOn];
        if (subset) {

            switch(queryMethod.type) {
            case 'clustering.kmeans':
                self._clusteringKMeans(queryMethod, subset);
                break;
            case 'visualization':
                self._visualizationSetup(queryMethod, subset);
            }

            // check if queryMethod is an error
            if (queryMethod instanceof Error) {
                // something went wrong return an error
                throw { errors: { message: 'createMethod: cannot initialize method - invalid method parameters' } };
            } else {
                // everything is fine - continue with saving method
                return self._saveMethod(queryMethod, subset);
            }
        } else {
            return { errors: { message: `createMethod: No subset with id=${method.appliedOn}` } };
        }
    }

    /**
     * Calculates the aggregates on the subset.
     * @param {Number} subsetId - The subset id.
     * @returns {Object} Object containing the method id.
     */
    aggregateSubset(subsetId) {
        // TODO: log activity

        let self = this;

        const subset = self.base.store('Subsets')[subsetId];
        if (subset) {
            // get dataset fields and subset elements
            const fields = self.base.store('Dataset').fields;
            const elements = subset.hasElements;

            // store the method
            let qMethod = {
                type: 'aggregate.subset',
                parameters: { subsetId },
                result: { aggregates: [ ] },
                appliedOn: subsetId
            };

            // iterate through the fields
            for (let field of self.fields) {
                // get aggregate distribution
                let distribution = self._aggregateByField(elements, field);
                qMethod.result.aggregates.push({ field: field.name, type: field.aggregate, distribution });
            }

            // save the method
            return self.createMethod(qMethod);

        } else {
            return { errors: { message: `aggregateSubset: No subset with id=${subsetId}` } };
        }
    }

    /**
     * Aggregates elements by field and type.
     * @param {RecordSet} elements - A record set of elements.
     * @param {Object} field - Object containing field name and type.
     * @param {String} type - The aggregate type.
     * @returns The results of the aggregation.
     * @private
     */
    _aggregateByField(elements, field) {
        // TODO: check if field exists
        const fieldName = field.name;
        const aggregate = field.aggregate;
        let distribution = elements.aggr({ name: `${aggregate}_${fieldName}`, field: fieldName, type: aggregate });
        return distribution;
    }

    /**
     * Format the dataset info.
     * @returns {Object} The dataset json representation.
     * @private
     */
    _formatDatasetInformation() {
        let self = this;
        //  get subset info
        let { subsets } = self.getSubsetInformation();
        // subset ids used in the dataset info
        let subsetIds = subsets.map(set => set.id);

        return {
            id: self.params.datasetId,
            label: self.params.label,
            description: self.params.description,
            created: self.params.created,
            numberOfDocuments: self.base.store('Dataset').length,
            hasSubsets: subsetIds,
            fields: self.base.store('Dataset').fields
        };
    }

    /**
     * Formats the subset record.
     * @param {Object} rec - The subset record.
     * @returns {Object} The subset json representation.
     * @private
     */
    _formatSubsetInformation(rec) {
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
     * @private
     */
    _formatDocumentInformation(rec) {
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
     * @private
     */
    _formatMethodInformation(rec) {
        return {
            id: rec.$id,
            type: 'methods',
            methodType: rec.type,
            parameters: rec.parameters,
            result: this._formatMethodResults(rec.type, rec.result),
            produced: !rec.produced.empty ? rec.produced.map(subset => subset.$id) : null,
            appliedOn: !rec.appliedOn.empty ? rec.appliedOn.map(subset => subset.$id) : null
        };
    }

    /**
     * Formats the method results.
     * @param {String} type - The method type.
     * @param {Object} result - The results saved in the method.
     * @returns {Object} The formated method results.
     * @private
     */
    _formatMethodResults(type, result) {
        switch(type) {
        case 'clustering.kmeans':
            return this._formatKMeansClustering(result);
        default:
            return result;
        }
    }

    /**
     * Formats the KMeans results.
     * @param {Object} result - The KMeans results.
     * @returns {Object} The formated results.
     * @private
     */
    _formatKMeansClustering(result) {
        return {
            clusters: result.clusters.map(cluster => ({
                documentCount: cluster.docIds.length,
                aggregates: cluster.aggregates,
                subsetCreated: cluster.subsetCreated,
                subsetId: cluster.subsetId,
                clusterLabel: cluster.clusterLabel
            }))
        };
    }

    /**
     * Handles filter method.
     * @param {Object} methodParams - Method parameters.
     * @param {Object} subset - The subset object.
     * @returns {Object} The stored method object.
     * @private
     */
    _saveMethod(methodParams, subset) {
        let self = this;
        let methodId = self.base.store('Methods').push(methodParams);
        self.base.store('Methods')[methodId].$addJoin('appliedOn', subset);
        return { methods: self._formatMethodInformation(self.base.store('Methods')[methodId]) };
    }

    /**
     * Creates a feature space out of the features.
     * @param {Object[]} features - Object of feature elements.
     * @returns {Object} The feature space.
     * @private
     */
    _createFeatureSpace(features) {
        return new qm.FeatureSpace(this.base, features);
    }

    /**
     * Cluster the subset using KMeans and save results in methodParams.
     * @param {Object} query - Method parameters.
     * @param {Object} subset - The subset object.
     * @private
     */
    _clusteringKMeans(query, subset) {
        let self = this;

        // set placeholder for feature space parameters
        let features;
        // set kmeans and features space parameters
        switch (query.parameters.method.clusteringType) {
            case 'text':
                // set kmeans and features space parameters
                query.parameters.method.distanceType = 'Cos';
                features = [{
                    type: 'text', field: query.parameters.fields,
                    ngrams: 2, hashDimension: 200000
                }]; break;
            case 'number':
                query.parameters.method.distanceType = 'Euclid';
                features = query.parameters.fields.map(fieldName => ({
                    type: 'numeric', field: fieldName
                })); break;
        }
        features.forEach(feature => { feature.source = 'Dataset'; });

        /////////////////////////////////////////
        // Validate features object
        /////////////////////////////////////////
        if (!self._featuresValidation(features)) {
            // features object is not in correct schema - set query
            // to Error and exit this function
            query = new Error('Features are not in correct schema');
            return;
        }

        // create the feature space using the validated features object
        let featureSpace = self._createFeatureSpace(features);

        // get subset elements and update the feature space
        const documents = subset.hasElements;
        featureSpace.updateRecords(documents);

        // get matrix representation of the documents
        const spMatrix = featureSpace.extractSparseMatrix(documents);

        // finalize kmeans clustering parameters
        query.parameters.method.allowEmpty = false; // don't allow empty clusters

        /////////////////////////////////////////
        // Validate KMeans parameter
        /////////////////////////////////////////
        if (!validator.validateSchema(query.parameters.method, validator.schemas.methodKMeansParams)) {
            // method parameters are not in correct schema - set query
            // to Error and exist this function
            query = new Error('KMeans parameters are not in correct schema');
            return;
        }

        // create kmeans model and feed it the sparse document matrix
        let KMeans = new qm.analytics.KMeans(query.parameters.method);
        KMeans.fit(spMatrix);
        // get the document-cluster affiliation
        const idxv = KMeans.getModel().idxv;
        // prepare clusters array in the results
        query.result = {
            clusters: Array.apply(null, Array(query.parameters.method.k))
                .map(() => ({ docIds: [ ], aggregates: [ ], subsetCreated: false }))
        };

        // populate the result clusters
        for (let id = 0; id < idxv.length; id++) {
            const docId = documents[id].$id;
            const clusterId = idxv[id];
            // store the document id in the correct cluster
            query.result.clusters[clusterId].docIds.push(docId);
        }

        // for each cluster calculate the aggregates
        for (let i = 0; i < query.result.clusters.length; i++) {
            // get elements in the cluster
            const docIds = new qm.la.IntVector(query.result.clusters[i].docIds);
            const clusterElements = self.base.store('Dataset').newRecordSet(docIds);

            // iterate through the fields
            for (let field of self.fields) {
                // get aggregate distribution
                let distribution = self._aggregateByField(clusterElements, field);
                query.result.clusters[i].aggregates.push({ field: field.name, type: field.aggregate, distribution });
            }
            // set cluster label out of the first keyword cloud
            let clusterLabel;
            for (let aggregate of query.result.clusters[i].aggregates) {
                if (aggregate.type === 'keywords' && aggregate.distribution) {
                    clusterLabel = aggregate.distribution.keywords.slice(0, 3)
                        .map(keyword => keyword.keyword).join(', ');
                    break;
                }
            }
            // if clusterLabel was not assigned - set a lame label
            // TODO: intelligent label setting
            if (!clusterLabel) { clusterLabel = `Cluster #${i+1}`; }
            // set the cluster label
            query.result.clusters[i].clusterLabel = clusterLabel;
        }
    }

    _visualizationSetup(query, subset) {
        query.result = 'visualization';
    }

    /**
     * Validates the `features` object.
     * @param {Object} features - The features used to fill the feature space.
     */
    _featuresValidation(features) {
        return validator.validateSchema(features, validator.schemas.featureSchema);
    }

}

module.exports = BaseDataset;