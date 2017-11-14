// external modules
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// internal modules
const pg = require('../lib/postgresQL')(require('../config/pgconfig')); // postgres connection
// contains the process handler class
const ProcessHandler = require('../lib/processHandler');
// parameters used on the express app
const PORT = process.env.PORT || process.env.npm_package_config_portGui || 3000;

// child process container
let childProcesses = new ProcessHandler();

// on manual process exit
process.on('SIGINT', () => {
    // disconnect each child process
    childProcesses.close();
    // end process with no error
    process.exit(0);
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
require('./routes/api')(app, pg, childProcesses);

// handle ember web application
// IMPORTANT: must be after all routes
app.get('*', (req, res) => {
    res. sendFile('./public/index.html', { root: __dirname });
});

// run the express app
app.listen(PORT, () => console.log('gui-server listening on port', PORT));