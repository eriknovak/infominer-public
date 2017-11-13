// external modules
const assert = require('assert');
const fs = require('fs');
// internal modules
const BaseDataset = require('../../lib/baseDataset');
const fileManager = require('../../lib/fileManager');


// TODO: write unit tests for BaseDataset
describe('BaseDataset Tests', function () {

    // removes the test qminer db
    function removeFolder() { fileManager.removeFolder('./data/'); }

    describe('Initialization', function () {
        // clean folders - avoid commiting test db
        before(removeFolder);
        after(removeFolder);

        // close database after each test
        // ensures smooth unit testing
        afterEach(function(done) {
            // IMPORTANT: close dataset
            database.close(); done();
        });

        // database placeholder
        let database;

        // create file buffer object simulating dataset file upload
        let file = {
            buffer: fs.readFileSync('../dummy-data/test-dataset.txt')
        };

        // fields of the dataset
        let fields = [
            { name: 'title', type: 'string', included: true },
            { name: 'description', type: 'string', included: true },
            { name: 'rating', type: 'string', included: true }
        ];
        // dataset information
        let dataset = {
            label: 'test-dataset'
        };

        it('should fill the database with dataset', function(done) {
            // loading takes more time
            this.timeout('50000');

            // set test params
            let params = {
                data_folder: './data',
                user: 'user',
                db: '00',
                mode: 'createClean'
            };
            // create database
            database = new BaseDataset(params, fields);
            database.pushDocsToBase(file, fields);
            // check if it contains the dataset
            assert.equal(database.base.store('Dataset').length, 3, 'Dataset should contain 3 records');
            assert.equal(database.base.store('Subsets').length, 0, 'Subsets shoud have 0 records');
            // end test
            done();
        });

        it('should fill the database with dataset & add a subset', function(done) {
            // loading takes more time
            this.timeout('50000');

            // set test params
            let params = {
                data_folder: './data',
                user: 'user',
                db: '00',
                mode: 'createClean'
            };
            // create database
            database = new BaseDataset(params, fields);
            database.pushDocsToBase(file, fields, dataset);
            // check if it contains the dataset
            assert.equal(database.base.store('Dataset').length, 3, 'Dataset should contain 3 records');
            assert.equal(database.base.store('Subsets').length, 1, 'Subsets shoud have 1 records');
            assert.equal(database.base.store('Subsets')[0].label, dataset.label, 'Subset labels should match');
            // end test
            done();
        });

        it('should load the database', function(done) {
            // set test params
            let params = {
                data_folder: './data',
                user: 'user',
                db: '00',
                mode: 'open'
            };
            // create database
            database = new BaseDataset(params);
            // check if it contains the dataset
            assert.equal(database.base.store('Dataset').length, 3, 'Dataset should contain 3 records');
            assert.equal(database.base.store('Subsets').length, 1, 'Subsets shoud have 1 records');
            assert.equal(database.base.store('Subsets')[0].label, dataset.label, 'Subset labels should match');
            // end test
            done();
        });

    });

});