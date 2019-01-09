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
        // store the document ids based on their label
        this._positivelyLabelledDocs = [];
        this._negativelyLabelledDocs = [];
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
            const { document, label } = currentDoc;
            // get the position of the document with id = documentId
            for (let documentIdx = 0; documentIdx < self.documents.length; documentIdx++) {
                if (self.documents[documentIdx].$id === document.id) {

                    // update element label of the found document
                    self.activeLearner.setLabel(documentIdx, label);

                    // update the document label parameters
                    self.params.parameters.labelledDocs.push({ document, label });

                    // update the label count and store document id
                    if (label > 0) {
                        self._labelCount.positive++;
                        self._positivelyLabelledDocs.push(document.id);
                    } else if (label < 0) {
                        self._labelCount.negative++;
                        self._negativelyLabelledDocs.push(document.id);
                    }
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

        // get the keyword clouds of positive and negative subsets
        const { positive, negative } = self._getSubsetKeywords();
        // number of negative and positive predictions
        let statistics = {
            labelled: self._labelCount,
            predicted: {
                positive,
                negative,
                get all () { return this.positive.count + this.negative.count; }
            }
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
        self._stopwordsAL = { language: 'en', words: [''] };

        if (self.stopwords) {
            self._stopwordsAL.words = self._stopwordsAL.words.concat(self.stopwords);
        }
        if (self.params.parameters.stopwords) {
            let words = self.params.parameters.stopwords;
            self._stopwordsAL.words = self._stopwordsAL.words.concat(words);
        }

        self.features = [{
            type: 'text',
            source: 'Dataset',
            field: self.params.parameters.fields,
            ngrams: 2,
            tokenizer: {
                type: 'simple',
                stemmer: 'porter',
                stopwords: self._stopwordsAL
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

        self.activeLearner = new qm.analytics.ActiveLearner({
            learner: { disableAsserts: true },
            SVC: {
                algorithm: 'LIBSVM',
                c: 2,   // cost parameter
                j: 2,   // unbalance parameter
                eps: 1e-3, // epsilon insensitive loss parameter
                batchSize: 1000,
                maxIterations: 10000,
                maxTime: 1, // maximum runtime in seconds
                minDiff: 1e-6, // stopping criterion tolerance
                type: 'C_SVC',
                kernel: 'RBF',  // radial basis function kernel (makes loops)
                gamma: 2.0, // designates the tail of the normal distribution
                coef0: 2.0  // scaling parameter
            }
        });
        // set matrix values
        self.activeLearner.setX(self.featureMatrix);

        // set the labels of the active learner
        let labels = new qm.la.IntVector(Array(self.documents.length).fill(0));
        self.activeLearner.sety(labels);
    }


    /**
     * Gets the seed documents - those that are most and least similar to
     * the query text.
     * @param {Number} [MAX_COUNT=20] - The number of documents in the document list.
     * @returns {Object[]} The most and least similar documents, randomly
     * sorted.
     */
    * _makeDocumentIterator(MAX_COUNT=20) {
        let self = this;

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
            // did we went through all documents of the first search?
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
     * @param {Number} [numberOfUncertain=1] - The number of uncertain documents to get.
     * @returns {Object} The border document.
     */
    _getNextUncertainDocument(numberOfUncertain=1) {
        let self = this;
        // get the next uncertain document id
        let idx = self.activeLearner.getQueryIdx(numberOfUncertain)[0];
        let document = self._formatter.document(self.documents[idx]);
        return document;
    }


    /**
     * Gets the positive and negative labelled sets of documents.
     * @returns {Object} The object containing the record sets labelled as
     * positive and negative.
     */
    _getSubsetKeywords() {
        let self = this;

        // get the model and predict labels for the documents
        const model = self.activeLearner.getSVC();
        let predictions = model.predict(self.featureMatrix);

        // get the document subset for positive and negative labels
        self._predictedPositiveIds = new qm.la.IntVector();
        self._predictedNegativeIds = new qm.la.IntVector();

        // iterate through predictions - manually labelled documents have greater priority
        for (let position = 0; position < predictions.length; position++) {

            let documentId = self.documents[position].$id;
            if (self._positivelyLabelledDocs.includes(documentId)) {
                // store already positively labelled document
                self._predictedPositiveIds.push(documentId);
            } else if (self._negativelyLabelledDocs.includes(documentId)) {
                // store already negatively labelled document
                self._predictedNegativeIds.push(documentId);
            } else if (predictions[position] > 0) {
                // store positively predicted document
                self._predictedPositiveIds.push(documentId);
            } else {
                // store negatively predicted document
                self._predictedNegativeIds.push(documentId);
            }
        }
        // get positive and negative documents respectively
        const positiveRecords = self.base.store('Dataset').newRecordSet(self._predictedPositiveIds);
        const negativeRecords = self.base.store('Dataset').newRecordSet(self._predictedNegativeIds);

        // prepare aggregation parameters
        // used to calculate positive and negative keywords
        const aggregateParams = {
            name: `aggregate_${self._defaultField}`,
            field: self._defaultField,
            type: 'keywords',
            sample: 1000,
            tokenize: true,
            stemmer: false,
            stopwords: {
                language: 'en',
                stopwords: self._stopwordsAL
            }
        };

        // calculate the aggregates for the record set
        let positiveKeywordDistribution = positiveRecords.aggr(aggregateParams).keywords;
        let negativeKeywordDistribution = negativeRecords.aggr(aggregateParams).keywords;

        // return the document subsets
        return {
            positive: {
                count: self._predictedPositiveIds.length,
                distribution: positiveKeywordDistribution
            },
            negative: {
                count: self._predictedNegativeIds.length,
                distribution: negativeKeywordDistribution
            }
        };

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
                positive: { docIds: self._predictedPositiveIds.toArray() },
                negative: { docIds: self._predictedNegativeIds.toArray() }
            }
        };
        // create the method
        let methodId = self.base.store('Methods').push(params);

        self.base.store('Methods')[methodId].$addJoin('appliedOn', self.subset.$id);
        return { methodId, fields: self.fields };
    }

}

module.exports = ActiveLearner;