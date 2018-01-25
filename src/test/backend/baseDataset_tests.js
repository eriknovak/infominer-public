// external modules
const assert = require('assert');
// internal modules
const BaseDataset = require('../../lib/baseDataset');
const fileManager = require('../../lib/fileManager');


describe('BaseDataset Tests', function () {

    // clean folders - avoid commiting test db
    before(removeFolder);
    after(removeFolder);

    // removes the test qminer db
    function removeFolder() { fileManager.removeFolder('./data/'); }

    // set test params
    let params = {
        mode: 'createClean',
        dbPath: './data/user/00',
        label: 'test-dataset',
        created: '1/1/2018',
        description: 'this is a test description',
        datasetId: 0
    };

    describe('Initialization', function () {

        // close database after each test
        // ensures smooth unit testing
        afterEach(function(done) {
            // IMPORTANT: close dataset
            database.close(); done();
        });

        // database placeholder
        let database;

        // create file buffer object simulating dataset file upload
        let filePath = '../dummy-data/test-dataset.csv';

        // fields of the dataset
        let fields = [
            { name: 'title', type: 'string', included: true },
            { name: 'description', type: 'string', included: true },
            { name: 'rating', type: 'string', included: true }
        ];

        it('should fill the database with dataset', function(done) {
            // create database
            database = new BaseDataset(params, fields);
            database.pushDocuments(filePath, fields);
            // check if it contains the dataset
            assert.equal(database.base.store('Dataset').length, 3, 'Dataset should contain 3 records');
            assert.equal(database.base.store('Subsets').length, 1, 'Subsets shoud have 0 records');
            assert.equal(database.base.store('Subsets')[0].label, 'root', 'Subset labels should match');
            // end test
            done();
        });

        it('should load the database', function(done) {
            let params = {
                mode: 'open',
                dbPath: './data/user/00',
                label: 'test-dataset',
                created: '1/1/2018',
                description: 'this is a test description',
                datasetId: 0
            };

            // create database
            database = new BaseDataset(params);
            // check if it contains the dataset
            assert.equal(database.base.store('Dataset').length, 3, 'Dataset should contain 3 records');
            assert.equal(database.base.store('Subsets').length, 1, 'Subsets shoud have 1 records');
            assert.equal(database.base.store('Subsets')[0].label, 'root', 'Subset labels should match');
            // end test
            done();
        });

        it('should load the database parameters', function(done) {

            let params = {
                mode: 'open',
                dbPath: './data/user/00',
                label: 'test-dataset',
                created: '1/1/2018',
                description: 'this is a test description',
                datasetId: 0
            };

            // create database
            database = new BaseDataset(params);
            // check if it contains the dataset
            assert.equal(database.base.store('Dataset').length, 3, 'Dataset should contain 3 records');
            assert.equal(database.base.store('Subsets').length, 1, 'Subsets shoud have 1 records');
            assert.equal(database.base.store('Subsets')[0].label, 'root', 'Subset labels should match');

            assert.equal(database.params.label, params.label, 'Subset labels should match');
            assert.equal(database.params.description, params.description, 'Subset labels should match');
            assert.equal(database.params.datasetId, params.datasetId, 'Subset labels should match');
            assert.equal(database.params.dbPath, params.dbPath, 'Subset labels should match');

            // end test
            done();
        });

    });

    describe('Get/Set functions', function () {
        // database placeholder
        let database;

        // open database
        before(function () {
            // create file buffer object simulating dataset file upload
            let filePath = '../dummy-data/test-dataset.csv';
            // fields of the dataset
            let fields = [
                { name: 'title', type: 'string', included: true },
                { name: 'description', type: 'string', included: true },
                { name: 'rating', type: 'string', included: true }
            ];
            // create database
            database = new BaseDataset(params, fields);
            database.pushDocuments(filePath, fields);
        });

        // close database after each test
        // ensures smooth unit testing
        after(function(done) {
            // IMPORTANT: close dataset
            database.close(); done();
        });

        describe('getId', function () {
            it('should get the dataset id', function (done) {
                assert.equal(database.getId(), 0, 'Dataset ids do not match');
                // end test
                done();
            });
        });

        describe('getDbPath', function () {
            it('should get the db path', function (done) {
                assert.equal(database.getDbPath(), './data/user/00', 'DB path does not match');
                // end test
                done();
            });
        });

        describe.skip('getDatasetInformation', function () {
            it('should get the dataset info', function (done) {
                // gets the dataset info
                let datasetInfo = database.getDatasetInformation();
                // TODO: check schema

                // end test
                done();
            });
        });

        describe.skip('getSubsetInformation', function () {
            it('should get the info of all subsets', function (done) {
                // gets the dataset info
                let subsetsInfo = database.getSubsetInformation();
                // TODO: check schema

                // end test
                done();
            });
            it('should get the info of the first subset', function (done) {
                // gets the dataset info
                let subsetInfo = database.getSubsetInformation(0);
                // TODO: check schema

                // end test
                done();
            });
        });

        describe('getSubsetDocuments', function () {
            it('should get all of the documents of the root subset', function (done) {
                let documents = database.getSubsetDocuments(0, {});
                assert.equal(documents.documents.length, 3, 'Method should return 3 documents');
                // end test
                done();
            });

            it('should return the pagination parameters', function (done) {
                let documents = database.getSubsetDocuments(0, {});
                assert.notEqual(documents.meta.pagination, null, 'Pagination should be present');
                assert.equal(documents.meta.pagination.page, 1, 'Page should be equal to 1');
                assert.equal(documents.meta.pagination.limit, 10, 'Limit value should be 10');
                assert.equal(documents.meta.pagination.documentCount, 3, 'Document count should be 3');
                // end test
                done();
            });
        });

        describe('getMethodInformation', function () {
            it('should get the info of all methods - empty array', function (done) {
                // gets the dataset info
                let methodInfo = database.getMethodInformation();
                // TODO: check schema
                assert.equal(methodInfo.methods.length, 0, 'methodInfo is not empty');
                // end test
                done();
            });
            it('should get the info of the first method', function (done) {
                // gets the dataset info
                let methodInfo = database.getMethodInformation(0);
                assert.notEqual(methodInfo.errors, null, 'methodInfo should be null');

                // end test
                done();
            });
        });

        describe('createMethod', function () {
            // method values
            let qMethod = {
                type: 'filter.manual',
                parameters: { docId: [0, 1] },
                result: { docId: [0, 1] },
                appliedOn: 0
            };
            it ('should create a new method', function (done) {
                assert.doesNotThrow(function () {
                    database.createMethod(qMethod);
                });
                // end test
                done();
            });
            it('should have the method in the database', function (done) {
                let method = database.base.store('Methods')[0];
                // TODO: schema check
                assert.equal(method.type, qMethod.type, 'Method type is not same');
                assert.equal(method.parameters.docId.length, qMethod.parameters.docId.length, 'Parameters should contain docId with 2 elements');
                assert.equal(method.result.docId.length, qMethod.result.docId.length, 'Result should contain docId with 2 elements');
                // end test
                done();
            });
        });

        describe('createSubset', function () {
            // the subset object
            let subset = {
                label: 'new subset',
                description: 'this is a new subset',
                resultedIn: 0,
                documents: [0, 1]
            };

            it('should create a subset', function (done) {
                assert.doesNotThrow(function () {
                    database.createSubset(subset);
                });
                // end test
                done();
            });

            it('should return subset id', function (done) {
                let newSubset = database.createSubset(subset);
                assert.equal(newSubset.subsets.id, 2, 'Subset ids does not match');
                // end test
                done();
            });
        });

    });

});