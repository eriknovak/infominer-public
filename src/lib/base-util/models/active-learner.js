/************************************************
 * The Active Learner model from QMiner.
 */

// external modules
const qm = require('qminer');

// internal modules
const formatter = require('../formatter');

class ActiveLearner {

    /**
     * The constructor of the active learner.
     * @param {Object} base - Record set to be labelled.
     * @param {String} subsetId - The subset id that is being targeted.
     * @param {Object} [optional] - Optional parameters.
     * @param {Number} optional.retrainThreshold - How many labels are required
     * to retrain the model. Retrains after every 'retrainThreshold' labels.
     */
    constructor(base, subsetId, optional = {}) {
        let self = this;

        // store dataset containing documents
        self.store = base.store('Dataset');

        // store documents
        self.documents = base.store('Subsets')[subsetId].hasElements;

        // configure features
        let features = [{
            // text feature extractor
            type: 'text',
            field: self.store.fields
                .filter(field => field.type === 'string')
                .map(field => field.name),
            ngrams: 2,
            hashDimension: 20000,
            source: 'Dataset'
        }];

        // get feature matrix from record set
        self.featureSpace = new qm.FeatureSpace(base, features);
        self.featureSpace.updateRecords(self.documents);
        self.featureMatrix = self.featureSpace.extractSparseMatrix(self.documents);

        // creates the active learner
        self.activeLearner = new qm.analytics.ActiveLearner();

        // set matrix values
        self.activeLearner.setX(self.featureMatrix);

        // set the labels
        let labels = new qm.la.IntVector(Array(self.documents.length).fill(0));
        self.activeLearner.sety(labels);

        // specify the default field
        self.defaultField = self.store.fields
            .filter(field => field.type === 'string')[0].name;

        // set retrain threshold
        self._retrainThreshold = optional.retrainThreshold || 10;
        self._learnerInitialized = false;
    }

    /**
     * @description Gets Nearest Neighbors of the query.
     * @param {Object} query - The query object. Can be object containing the text
     * attributes.
     * @param {Object} [query.text] - The text used to find similar content.
     * @param {Number} [maxCount=100] - The maximal neighbor count.
     * @param {Number} [minSim=0.05] - Minimal similarity treshold.
     * @return {Array.<Object>} An array where the first element is a record set
     * of relevant solutions and the second element is an array of similarity measures.
     */
    _search(query, maxCount=100, minSim=0.05) {
        let self = this;

        // transform the query json into a sparse vector
        let record = { [self.defaultField]: query.text };
        let queryRec = self.store.newRecord(record);

        if (!queryRec) {
            // there is no record in the record set containing the url
            // return an empty record set with weights
            // TODO: tell the user of the missing record
            return [store.newRecordSet(), []];
        }

        let vector = self.featureSpace.extractSparseVector(queryRec);
        // calculate similarities between query vector and content
        let sim = self.featureMatrix.multiplyT(vector);
        let sort = sim.sortPerm(false);
        let idVec = qm.la.IntVector();
        let simVec = [ ];

        if (maxCount > sort.perm.length) {
            // the threshold is larger than the similarity vector
            maxCount = sort.perm.length;
        }

        for (let i = 0; i < maxCount; i++) {
            // get content id of (i+1)-th most similar content
            let maxid = sort.perm[i];
            // stop if similarity to small
            if (sim[maxid] < minSim) { break; }
            // else remember the content and it's similarity
            idVec.push(maxid);
            simVec.push(sim[maxid]);
        }

        // return the record set and their similarities
        return [self.store.newRecordSet(idVec), simVec];
    }

    /**
     * Gets the seed documents - those that are most and least similar to
     * the query text.
     * @param {Object} query - The query used to get seed documents.
     * @param {String} query.text - The query text.
     * @returns {Object[]} The most and least similar documents, randomly
     * sorted.
     */
    getSeedDocuments(query) {
        let self = this;
        // get the documents with the similarities
        let documents = self._search(query)[0];
        // get the first and last 10 documents
        let sample = documents.sample(20); sample.shuffle(100);
        // format and return the documents
        return sample.map(document => formatter.document(document));
    }

    /**
     * Adds a label for the given document.
     * @param {Object} document - The document to be labelled.
     * @param {Number} label - The label of the document: -1 for negative
     * and +1 for positive label.
     * @returns {Number} The id of the document if document is found. Otherwise,
     * returns undefined.
     */
    addLabel(document, label) {
        let self = this;
        // get the position of the document with id = elementId
        let documentIdx;
        for (documentIdx = 0; documentIdx < self.documents.length; documentIdx++) {
            if (self.documents[documentIdx].$id === document.id) {
                // update element label of the found document
                self.activeLearner.setLabel(documentIdx, label);
                break;
            }
        }

        // when active learner is initialized retrain the model
        if (self._learnerInitialized && self.activeLearner.gety().size % self._retrainThreshold === 0) {
            self.activeLearner.retrain();
        }

        // return the id of the document
        return documentIdx;
    }

    initializeModel() {
        let self = this;
        // retrains the active learner
        self.activeLearner.retrain();
        self._learnerInitialized = true;
    }

    /**
     * Gets the next border document.
     * @returns {Object} The border document.
     */
    getNextDocument() {
        let self = this;
        // get the next uncertain document id
        let idx = self.activeLearner.getQueryIdx(1)[0];
        let document = formatter.document(self.documents[idx]);
        return document;
    }

    /**
     * Gets the positive and negative labelled sets of documents.
     * @param {Boolean} retrainFlag - If the model needs to be retrained.
     * @returns {Object} The object containing the record sets labelled as
     * positive and negative.
     */
    getSubsets(retrainFlag=false) {
        let self = this;

        if (retrainFlag) { self.activeLearner.retrain(); }

        // get the model and predict labels for the documents
        const model = self.activeLearner.getSVC();
        let predictions = model.predict(self.featureMatrix);

        // get the document subset for positive and negative labels
        let positiveIds = new qm.la.IntVector();
        let negativeIds = new qm.la.IntVector();
        for (let position = 0; position < predictions.length; position++) {
            if (predictions[position] === 1) {
                positiveIds.push(position);
            } else {
                negativeIds.push(position);
            }
        }
        // get positive and negative documents respectively
        let positive = self.store.newRecordSet(positiveIds);
        let negative = self.store.newRecordSet(negativeIds);

        // return the document subsets
        return { positive, negative };

    }


}

module.exports = ActiveLearner;