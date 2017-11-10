// external modules
const multer = require('multer');
const request = require('request-promise-native');
// parameter values
let upload = multer();

/**
 * Adds api routes to express  app.
 * @param {Object} app - Express app.
 */
module.exports = function (app) {

    // data server domain
    const dataDomain = `http://localhost:${process.env.npm_package_config_portData}`;

    // TODO: ensure handling large datasets
    app.post('/api/dataset/new', upload.single('file'), (req, res) => {
        // get dataset info
        let { dataset, fields } = req.body;
        let file = req.file;
        // prepare options for posting to data server
        let options = {
            method: 'POST',
            uri: `${dataDomain}${req.originalUrl}`,
            body: {
                dataset: JSON.parse(dataset),   // dataset info
                fields: JSON.parse(fields),     // fields for the store
                file: file                      // file object \w content
            },
            json: true // Automatically stringifies the body to JSON
        };
        // make the request
        request(options)
            .then(body => { console.log('Body', body); })
            .catch(err => { console.log('Err', err); })
            .then(() => res.end());

    });
};