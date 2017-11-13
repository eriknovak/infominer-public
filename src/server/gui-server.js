// external modules
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// internal modules
const pg = require('../lib/postgresQL')(require('../config/pgconfig')); // postgres connection

// parameters used on the express app
const PORT = process.env.PORT || process.env.npm_package_config_portGui || 3000;

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
require('./routes/api')(app, pg);

// handle ember web application
// IMPORTANT: must be after all routes
app.get('*', (req, res) => {
    res. sendFile('./public/index.html', { root: __dirname });
});

// run the express app
app.listen(PORT, () => console.log('gui-server listening on port', PORT));