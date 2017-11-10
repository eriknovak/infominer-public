// internal modules
const BaseDataset = require('../../backend/lib/baseDataset');

/**
 * Adds api routes to express  app.
 * @param {Object} app - Express app.
 */
module.exports = function (app) {

    // create new dataset
    app.post('/api/dataset/new', (req, res) => {

        let { dataset, fields, file } = req.body;

        let params = {
            user: 'user',
            db: '01',
            mode: 'createClean',
            dataset: dataset
        };

        console.log('** Creating new database **');
        let database = new BaseDataset(params, fields, file);
        console.log('Base created');
        database.pushDocsToBase(file, fields, dataset);
        console.log('Uploaded', database.base.store('Dataset').length);

        debugger;

        database.close();

        res.end();
    });


};