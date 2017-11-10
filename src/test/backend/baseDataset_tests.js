// external modules
const assert = require('assert');
const fs = require('fs');
// internal modules
const BaseDataset = require('../../backend/lib/baseDataset');
const fileManager = require('../../backend/lib/fileManager');


// TODO: write unit tests for BaseDataset
describe('BaseDataset Tests', function () {

    // removes the test qminer db
    function removeFolder() { fileManager.removeFolder('./data/'); }

    describe('Initialization', function () {

        before(removeFolder);
        after(removeFolder);

        // create file buffer object simulating dataset file upload
        let file = {
            buffer: fs.readFileSync('../dummy-data/test-dataset-big.txt')
        };

        // fields of the dataset
        let fields = [
            { name: 'title', type: 'string', included: true },
            { name: 'description', type: 'string', included: true },
            { name: 'rating', type: 'string', included: true }
        ];

        it('should fill the database with dataset', function (done) {
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
            let dataset = new BaseDataset(params, fields);
            dataset.pushDocsToBase(file, fields);
            // check if it contains the dataset
            assert.equal(dataset.base.store('Dataset').length, 1214400, 'Dataset should contain 1214400 records');
            // IMPORTANT: close dataset
            dataset.close(); done();
        });

        it('should load the database', function (done) {
            // set test params
            let params = {
                data_folder: './data',
                user: 'user',
                db: '00',
                mode: 'open'
            };
            // create database
            let dataset = new BaseDataset(params);
            // check if it contains the dataset
            assert.equal(dataset.base.store('Dataset').length, 1214400, 'Dataset should contain 1214400 records');
            // IMPORTANT: close dataset
            dataset.close(); done();
        });

    });

});