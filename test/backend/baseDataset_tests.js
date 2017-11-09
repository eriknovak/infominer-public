// external modules
const assert = require('assert');
const fs = require('fs');
// internal modules
const BaseDataset = require('../src/backend/lib/baseDataset');
const fileManager = require('../src/backend/lib/fileManager');


// TODO: write unit tests for BaseDataset
describe('BaseDataset Tests', function () {

    describe('Initialization', function () {

        afterEach(function() {
            // remove the data folder - containing qminer db
            fileManager.removeFolder('./data/');
        });

        // create file buffer object simulating dataset file upload
        let file = {
            buffer: fs.readFileSync('../dummy-data/test-dataset.txt')
        };

        // fields of the dataset
        let fields = JSON.stringify([
            { name: 'title', type: 'string', included: true },
            { name: 'description', type: 'string', included: true },
            { name: 'rating', type: 'string', included: true }
        ]);

        it('should fill the database with dataset', function () {
            // set test params
            let params = {
                data_folder: './data',
                user: 'user',
                db: '00',
                init: { mode: 'createClean', fields, file }
            };
            // create database
            let dataset = new BaseDataset(params);
            // check if it contains the dataset
            assert.equal(dataset.base.store('Dataset').length, 3, 'Dataset should contain 3 records');
            // IMPORTANT: close dataset
            dataset.close();
        });
    });

});