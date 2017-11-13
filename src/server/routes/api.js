// external modules
const multer = require('multer');   // accepting files from client
const stream = require('stream');   // create stream from file buffer
const fs = require('fs');

// internal modules
const fileManager = require('../../lib/fileManager');

// configurations
const static = require('../../config/static');

// parameter values
let upload = multer();

/**
 * Adds api routes to express  app.
 * @param {Object} app - Express app.
 * @param {Object} pg - Postgres wrapper.
 */
module.exports = function (app, pg) {

    // TODO: ensure handling large datasets
    app.post('/api/dataset/new', upload.single('file'), (req, res) => {
        // TODO: log calling this route

        // get dataset info
        let { dataset, fields } = req.body;
        let file = req.file;

        // parse the JSON values from the body
        dataset = JSON.parse(dataset);
        fields = JSON.parse(fields);

        // TODO: get username of creator
        const creator = 'user'; // temporary placeholder

        // get number of datasets the users already has
        pg.select({ creator }, 'datasets', (err, results) => {
            if (err) {
                // TODO: handle error
                console.log(err); return;
            }
            // number of datasets is the name of the new dataset folder
            const numOfDatasets = results.length;

            // set pg dataset values
            const label = dataset.label || 'root';                        // the user defined dataset label
            const dir = `${static.dataPath}/${creator}/${numOfDatasets}`; // dataset directory
            const sourcefile = file.originalname;                         // file original name

            // create dataset directory
            fileManager.createDirectoryPath(dir);

            // create write stream in dataset folder
            let filePath = `${dir}/${file.originalname}`;
            let writeStream = fs.createWriteStream(filePath);

            // save file in corresponding dataset folder
            let bufferStream = new stream.PassThrough();
            bufferStream.end(file.buffer);
            bufferStream.pipe(writeStream)
                .on('finish', () => {
                    // TODO: log completion
                    console.log('complete');
                    // save the metadata to postgres
                    pg.insert({ creator, label, dir, sourcefile }, 'datasets', (err, results) => {
                        if (err) {
                            // TODO: handle error
                            console.log(err); return;
                        }
                        // TODO: log postgres saving

                        // TODO: create a new child process

                        // end connection
                        return res.end();
                    });

                }); // bufferStream.on('finish')

        }); // pg.select({ creator })
    }); // POST /api/dataset/new


};