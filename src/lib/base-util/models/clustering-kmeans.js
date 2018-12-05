const qm = require('qminer');
const util = require('util');


const AbstractModel = require('./abstract-model');
class ClusteringKMeans extends AbstractModel {

    constructor(base, params, subset, fields, formatter) {
        super(base, params, subset, fields);
        this._formatter = formatter;
        this._prepareFeatureParameters();
    }


    /**********************************
     * Methods
     *********************************/

    update(params) {
        throw new Error('Method "update" must be implemented');
    }

    run(createSubsetsCb) {
        let self = this;
        const setImmediatePromise = util.promisify(setImmediate);
        // sequence of events to happen
        let sequence = [
            () => setImmediatePromise(self._createFeatureSpace()),
            (params) => self._trainKMeans(params),
            (params) => setImmediatePromise(self._prepareClusters(params)),
            (params) => setImmediatePromise(self._getClusterMetricsAndDocs(params)),
            (params) => setImmediatePromise(self._createMethod(params)),
            (params) => setImmediatePromise(createSubsetsCb(params))
        ];
        // run the promise serial
        self._promiseSerial(sequence);
    }

    save(fin) {
        throw new Error('Method "save" must be implemented');
    }

    load(fout) {
        throw new Error('Method "load" must be implemented');
    }


    /**********************************
     * Helper functions
     *********************************/

    _prepareFeatureParameters() {
        let self = this;
        let features;

        // based on clustering type setup feature parameters
        switch(self.params.parameters.method.clusteringType) {
            case 'text':
                // prepare stopwords for feature space
                let stopwords = { language: 'en' };
                if (self.params.parameters.stopwords) {
                    let words = self.params.parameters.stopwords;
                    stopwords.words = words;
                }

                // bag-of-words ft-idf model
                self.params.parameters.method.distanceType = 'Cos';
                features = [{
                    type: 'text',
                    field: self.params.parameters.fields,
                    ngrams: 2,
                    hashDimension: 20000,
                    tokenizer: {
                        type: 'simple',
                        stemmer: 'porter',
                        stopwords
                    }
                },{
                    type: 'constant',
                    const: 0.0001
                }]; break;

            case 'number':
                // euclidian space model
                self.params.parameters.method.distanceType = 'Euclid';
                features = self.params.parameters.fields.map(name => ({
                    type: 'numeric',
                    field: name
                })); break;
        }
        // update method parameters
        self.params.parameters.method.allowEmpty = false;
        features.forEach(feature => { feature.source = 'Dataset'; });

        // save the features as a private variable
        self.features = features;
    }



    _createFeatureSpace() {
        let self = this;

        // creates the feature space
        self.featureSpace = new qm.FeatureSpace(self.base, self.features);
        // update the feature space using the subset elements
        let documents = self.subset.hasElements;
        self.featureSpace.updateRecords(documents);
        // provide documents to the next step
        return { documents };
    }



    _trainKMeans({ documents }) {
        let self = this;

        // get matrix representation of the documents
        const matrix = self.featureSpace.extractSparseMatrix(documents);
        self.kMeans = new qm.analytics.KMeans(self.params.parameters.method);

        return new Promise(function (resolve, reject) {
            self.kMeans.fitAsync(matrix, error => {
                if (error) { return reject(error); }
                resolve({ documents, matrix });
            });
        });
    }



    _prepareClusters({ documents, matrix }) {
        let self = this;

        // get the document-cluster affiliation
        const idxv = self.kMeans.getModel().idxv;

        // prepare clusters array in the results
        self.params.result = {
            clusters: Array.apply(null, Array(self.params.parameters.method.k))
                .map(() => ({
                    avgSimilarity: null,
                    docIds:     [],
                    aggregates: [],
                    subset: {
                        created: false,
                        id: null,
                        deleted: false
                    }
                }))
        };

        let clusterDocs = { };
        // populate the cluster results
        for (let id = 0; id < idxv.length; id++) {
            const clusterId = idxv[id];
            const docId     = documents[id].$id;
            // store the document id in the correct cluster
            self.params.result.clusters[clusterId].docIds.push(docId);

            // save positions of documents of particular cluster
            if (clusterDocs[clusterId]) {
                clusterDocs[clusterId].push(id);
            } else {
                clusterDocs[clusterId] = [id];
            }
        }

        return { documents, matrix, clusterDocs };
    }



    _getClusterMetricsAndDocs({ documents, matrix, clusterDocs }) {
        let self = this;

        // calculate the average distance between cluster documents and centroid
        for (let clusterId of Object.keys(clusterDocs)) {

            // get document submatrix
            let positions = new qm.la.IntVector(clusterDocs[clusterId]);
            let submatrix = matrix.getColSubmatrix(positions);
            let centroid  = self.kMeans.centroids.getCol(parseInt(clusterId));

            if (self.params.parameters.method.distanceType === 'Cos') {
                // normalize the columns for cosine similiary
                submatrix.normalizeCols(); centroid.normalize();
            }

            // get distances between documents and centroid
            let distances = submatrix.multiplyT(centroid);
            if (self.params.parameters.method.distanceType === 'Cos') {
                self.params.result.clusters[clusterId].avgSimilarity = distances.sum() / submatrix.cols;
            }

            // sort distances with their indeces
            let sort  = distances.sortPerm(false);
            let idVec = qm.la.IntVector();

            let MAX_COUNT = 100;
            // set number of documents were interested in
            let maxCount = MAX_COUNT > sort.perm.length ? sort.perm.length : MAX_COUNT;

            for (let i = 0; i < maxCount; i++) {
                // get content id of (i+1)-th most similar content
                let maxId = sort.perm[i];
                // else remember the content and it's similarity
                idVec.push(documents[positions[maxId]].$id);
            }

            // get sample elements in the cluster and store them
            const cDocuments = self.base.store('Dataset').newRecordSet(idVec);
            self.params.result.clusters[clusterId].documentSample = cDocuments.map(
                doc => self._formatter.document(doc)
            );
        }

        return { };

    }


    _createMethod() {
        let self = this;
        // join the created method with the applied subset
        let methodId = self.base.store('Methods').push(self.params);
        self.base.store('Methods')[methodId].$addJoin('appliedOn', self.subset.$id);

        return { methodId, fields: self.fields };
    }
}

module.exports = ClusteringKMeans;