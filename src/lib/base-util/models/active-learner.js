/************************************************
 * The Active Learner model from QMiner.
 */

// external modules
const qm = require('qminer');

const AbstractModel = require('./abstract-model');
class ActiveLearner extends AbstractModel {


    constructor(base, params, subset, parameters, formatter) {
        super(base, params, subset, parameters);
        this._formatter = formatter;

        // set retrain threshold and learner initialized
        this._learnerInitialized = false;

        if (!this.params.parameters.labelledDocs) {
            this.params.parameters.labelledDocs = [];
        }

        // active learning parameter preparations
        this._prepareFeatureParameters();
        this._createFeatureSpace();
        this._createActiveLearnerModel();
        // count the number of positive and negative labels
        this._labelCount = { positive: 0, negative: 0 };
        // set an iterator for retrieving documents to be labelled
        this._documentIterator = this._makeDocumentIterator();
    }

    /**********************************
     * Methods
     *********************************/


    update(params) {
        let self = this;
        const { hash, currentDoc } = params;
        // store the hash number of the active learner
        if (hash) { self.hash = hash; }

        if (currentDoc) {
            // get the document id and label
            let docIds = self.documents.map(rec => rec.$id);
            const { document, label } = currentDoc;
            // get the position of the document with id = documentId
            for (let documentIdx = 0; documentIdx < self.documents.length; documentIdx++) {
                if (self.documents[documentIdx].$id === document.id) {
                    // update element label of the found document
                    self.activeLearner.setLabel(documentIdx, label);
                    // update the label count
                    let labelField = label > 0 ? 'positive' : label < 0 ? 'negative' : null;
                    if (labelField) self._labelCount[labelField]++;
                    // update the document label parameters
                    self.params.parameters.labelledDocs.push({ document, label });
                    break;
                }
            }
        }

        if (!self._learnerInitialized) {
            // check if we can initialize the model
            if (self._labelCount.positive > 2 && self._labelCount.negative > 2) {
                self.activeLearner.retrain();
                self._learnerInitialized = true;

                // also return the next uncertain document
                return self._getNextUncertainDocument();
            }
            // otherwise return the next document from seed
            return self._documentIterator.next().value;

        } else {
            self.activeLearner.retrain();
            // return the next uncertain document
            return self._getNextUncertainDocument();
        }
    }


    run(createSubsetsCb) {
        let self = this;
        // create the model and get its id
        let { methodId, fields } = self._createMethod();
        return createSubsetsCb({ methodId, fields });
    }

    save(fin) {
        throw new Error('Method "save" must be implemented');
    }

    load(fout) {
        throw new Error('Method "load" must be implemented');
    }

    getStatistics() {
        let self = this;

        // get the model and predict labels for the documents
        const model = self.activeLearner.getSVC();
        let predictions = model.predict(self.featureMatrix);

        let predicted = {
            positive: { count: 0 },
            negative: { count: 0 },
            get all () { return this.positive.count + this.negative.count; }
        };
        for (let id = 0; id < predictions.length; id++) {
            const label = predictions[id] > 0 ? 'positive' : 'negative';
            predicted[label].count++;
        }

        // get the keyword clouds of positive and negative subsets
        const { positive, negative } = self._getSubsetKeywordClouds();
        predicted.positive.distribution = positive;
        predicted.negative.distribution = negative;

        // number of negative and positive predictions
        let statistics = {
            labelled: self._labelCount,
            predicted
        };

        // return statistics
        return statistics;
    }

    isInitialized() {
        return this._learnerInitialized;
    }

    /**********************************
     * Helper functions
     *********************************/

    _prepareFeatureParameters() {
        let self = this;

        // prepare stopwords for feature space
        let stopwords = { language: 'en', words: [''] };
        if (self.stopwords) {
            stopwords.words = stopwords.words.concat(self.stopwords);
        }
        if (self.params.parameters.stopwords) {
            let words = self.params.parameters.stopwords;
            stopwords.words = stopwords.words.concat(words);
        }

        self.features = [{
            type: 'text',
            source: 'Dataset',
            field: self.params.parameters.fields,
            ngrams: 2,
            tokenizer: {
                type: 'simple',
                stemmer: 'porter',
                stopwords
            }
        }];

         // specify the default field
         this._defaultField = self.params.parameters.fields[0];
    }


    _createFeatureSpace() {
        let self = this;

        // creates the feature space
        self.featureSpace = new qm.FeatureSpace(self.base, self.features);
        // update the feature space using the subset elements
        self.documents = self.subset.hasElements;
        self.featureSpace.updateRecords(self.documents);
        self.featureMatrix = self.featureSpace.extractSparseMatrix(self.documents);
    }


    _createActiveLearnerModel() {
        let self = this;

        self.activeLearner = new qm.analytics.ActiveLearner();
        // set matrix values
        self.activeLearner.setX(self.featureMatrix);

        // set the labels of the active learner
        let labels = new qm.la.IntVector(Array(self.documents.length).fill(0));
        self.activeLearner.sety(labels);
    }


    /**
     * Gets the seed documents - those that are most and least similar to
     * the query text.
     * @returns {Object[]} The most and least similar documents, randomly
     * sorted.
     */
    * _makeDocumentIterator() {
        let self = this;
        // number of max documents
        const MAX_COUNT = 20;

        // set the query parameters
        const initQuery = self.params.parameters.initQuery;
        let _ascendingOrder = false;
        let _offset = 0;

        // the iteration count
        let _iterationCount = 0;

        function _checkResetParameters() {
            // checks if we already switched the sort order
            return !_ascendingOrder && self._labelCount.positive > 2;
        }

        //  create the placeholder for query documents
        let documents;
        const stop = self.documents.length;
        for (let i = 0; i < stop; i++) {

            if (_checkResetParameters()) {
                _iterationCount = 0;
                _ascendingOrder = true;
                _offset = 0;
            }

            let position = _iterationCount % MAX_COUNT;

            // calculate the next position of interest
            if (position === 0) {
                // get the next MAX_COUNT documents
                const qDocuments = self._search(initQuery, MAX_COUNT, _offset, _ascendingOrder)[0];
                // increment the offset - for next iteration
                _offset += MAX_COUNT;
                // format and return the documents
                documents = qDocuments.map(document => self._formatter.document(document));
            }

            _iterationCount++;
            yield documents[position];
        }
    }


    /**
     * @description Gets Nearest Neighbors of the query.
     * @param {Object} query - The query text.
     * @param {Number} [maxCount=100] - The maximal neighbor count.
     * @param {Number} [offset=0] - Where to start the counting.
     * @param {Boolean} [ascending=false] - If the documents are sorted in ascending order.
     * @return {Array.<Object>} An array where the first element is a record set
     * of relevant solutions and the second element is an array of similarity measures.
     * @private
     */
    _search(query, maxCount=100, offset=0, ascending=false) {
        let self = this;

        // transform the query json into a sparse vector
        const record = { [self._defaultField]: query };
        const queryRecord = self.base.store('Dataset').newRecord(record);
        if (!queryRecord) {
            // there is no record in the record set containing the url
            // return an empty record set with weights
            // TODO: tell the user of the missing record
            return [self.base.store('Dataset').newRecordSet(), []];
        }

        const vector = self.featureSpace.extractSparseVector(queryRecord);
        // calculate similarities between query vector and content
        let sim = self.featureMatrix.multiplyT(vector);
        let sort = sim.sortPerm(ascending);
        let idVec = qm.la.IntVector();
        let simVec = [ ];

        let upperLimit = maxCount + offset;
        if (upperLimit > sort.perm.length) {
            // the threshold is larger than the similarity vector
            upperLimit = sort.perm.length;
        }

        for (let i = offset; i < upperLimit; i++) {
            // get content id of (i+1)-th most similar content
            let maxid = sort.perm[i];
            // else remember the content and it's similarity
            idVec.push(self.documents[maxid].$id);
            simVec.push(sim[maxid]);
        }

        // return the record set and their similarities
        return [self.base.store('Dataset').newRecordSet(idVec), simVec];
    }


    /**
     * Gets the next border document.
     * @param {Number} [num=1] - The number of uncertain documents to get.
     * @returns {Object} The border document.
     */
    _getNextUncertainDocument(num=1) {
        let self = this;
        // get the next uncertain document id
        let idx = self.activeLearner.getQueryIdx(num)[0];
        let document = self._formatter.document(self.documents[idx]);
        return document;
    }


    /**
     * Gets the positive and negative labelled sets of documents.
     * @returns {Object} The object containing the record sets labelled as
     * positive and negative.
     */
    _getSubsetKeywordClouds() {
        let self = this;

        // get the model and predict labels for the documents
        const model = self.activeLearner.getSVC();
        let predictions = model.predict(self.featureMatrix);

        // get the document subset for positive and negative labels
        let positiveIds = new qm.la.IntVector();
        let negativeIds = new qm.la.IntVector();
        for (let position = 0; position < predictions.length; position++) {
            if (predictions[position] > 0) {
                positiveIds.push(self.documents[position].$id);
            } else {
                negativeIds.push(self.documents[position].$id);
            }
        }
        // get positive and negative documents respectively
        self.positive = self.base.store('Dataset').newRecordSet(positiveIds);
        self.negative = self.base.store('Dataset').newRecordSet(negativeIds);

        // calculate the aggregates for the record set
        let positiveKeywords = self._getKeywordDistribution(self.positive);
        let negativeKeywords = self._getKeywordDistribution(self.negative);

        // return the document subsets
        return {
            positive: {
                keywords: positiveKeywords
            },
            negative: {
                keywords: negativeKeywords
            }
        };

    }

    _getKeywordDistribution(dataset) {
        let self = this;

        // create placeholder for all of the text
        let string = '';

        // pull all text into one field
        dataset.each(rec => {
            for (let field of self.params.parameters.fields) {
                if (rec[field]) string += `${rec[field]} `;
            }
        });

        // get the tf-idf of the whole string
        const record = { [self._defaultField]: string };
        const vector = self.featureSpace.extractVector(record);

        // sort the vector
        let sort = vector.sortPerm(false);

        // setup placeholder for the distribution
        let distribution = [ ];

        let upperLimit = 100;
        if (upperLimit > sort.perm.length) {
            // the threshold is larger than the vector
            upperLimit = sort.perm.length;
        }

        for (let i = 0; i < upperLimit; i++) {
            // get content id of (i+1)-th terms with greatest weights
            let maxid = sort.perm[i];
            // remember the content and it's weights
            const keyword = self.featureSpace.getFeature(maxid);
            const weight = vector[maxid];
            distribution.push({ keyword , weight });
        }

        return distribution;
    }


    _createMethod() {
        let self = this;

        // get the positive and negative documents
        const { parameters } = self.params;

        // construct the parameter for method creation
        const params = {
            type: self.params.type,
            parameters,
            result: {
                positive: { docIds: self.positive.map(rec => rec.$id) },
                negative: { docIds: self.negative.map(rec => rec.$id) }
            }
        };
        // create the method
        let methodId = self.base.store('Methods').push(params);

        self.base.store('Methods')[methodId].$addJoin('appliedOn', self.subset.$id);
        return { methodId, fields: self.fields };
    }

}

module.exports = ActiveLearner;