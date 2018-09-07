// external modules
const qm = require('qminer');

// internal modules
const formatter = require('../formatter');

class ActiveLearner {

    /**
     * The constructor of the active learner.
     * @param {Object} documents - Record set to be labelled.
     * @param {Object} labels - The known labels of the record set.
     */
    constructor(base, subsetId, labels) {
        let self = this;
        // creates the active learner
        self.activeLearner = new qm.analytics.ActiveLearner();

        // store documents
        self.documents = base.store('Subsets')[subsetId].hasElements;

        // configure features
        let features = [{
            // text feature extractor
            type: 'text',
            field: base.store('Dataset').fields
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

        // set matrix values
        self.activeLearner.setX(self.featureMatrix);

        // set the labels
        // TODO: validate if valid instance
        self.labels = labels ?
            new qm.la.IntVector(labels) :
            new qm.la.IntVector(Array(self.documents.length).fill(0));

        self.activeLearner.sety(self.labels);
    }

    addLabel(element, label) {
        let self = this;
        // get the position of the document with id = elementId
        let elementIdx;
        for (elementIdx = 0; elementIdx < self.documents.length; elementIdx++) {
            if (self.documents[elementIdx].$id === element.id) { break; }
        }

        // update label of that element
        self.activeLearner.setLabel(elementIdx, label);

        return self._getNextDocument();
    }

    _getNextDocument() {
        let self = this;
        // get the next uncertain document id
        let nextDocumentId = self.activeLearner.getQueryIdx(1)[0];
        return self._getDocument(nextDocumentId);
    }

    _getDocument(idx) {
        let self = this;
        let document = formatter.document(self.documents[idx]);
        return document;
    }
}

module.exports = ActiveLearner;