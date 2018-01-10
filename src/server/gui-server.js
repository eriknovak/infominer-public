// external modules
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

// internal modules
const pg = require('../lib/postgresQL')(require('../config/pgconfig')); // postgres connection
// contains the process handler class
const ProcessHandler = require('../lib/processHandler');
// parameters used on the express app
const PORT = process.env.PORT || process.env.npm_package_config_portGui || 3000;

let processHandler = new ProcessHandler({
    processPath: path.join(__dirname, '/child_process/dataset.js')
});

// on manual process exit
// TODO: log closing process
process.on('SIGINT', () => {
    // disconnect each child process
    processHandler.closeAllProcesses((err) => {
        // TODO: log error
        if (err) { console.warn('Error when closing', err); }
        // close the postgres connection
        pg.close(() => {
            // close postgresql connection
            console.log('Everything closed');
            process.exit(0);
        });

    });
});

// express app creation
let app = express();

app.use(cors());                  // allow accessing from other external addresses
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({   // to support URL-encoded bodies
    extended: true
}));

// set where are public files
app.use(express.static(__dirname + '/public'));

// upload api routes
require('./routes/api/v1')(app, pg, processHandler);

// handle ember web application
// IMPORTANT: must be after all routes
app.get('*', (req, res) => {
    return res.sendFile('./public/index.html', { root: __dirname });
});

// run the express app
app.listen(PORT, () => console.log('gui-server listening on port', PORT));