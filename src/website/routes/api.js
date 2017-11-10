// external modules
const multer = require('multer');
// internal modules
const BaseDataset = require('../../backend/lib/baseDataset');

// parameter values
let upload = multer();

/**
 * Adds api routes to express  app.
 * @param {Object} app - Express app.
 */
module.exports = function (app) {

    app.post('/api/dataset/new', upload.single('file'), (req, res) => {

        let body = req.body;
        let file = req.file;

        let params = {
            user: 'user',
            db: '01',
            mode: 'createClean',
            dataset: JSON.parse(body.dataset)
        };

        let dataset = new BaseDataset(params, JSON.parse(body.fields), file);

        dataset.close();
        res.end();
    });
};