// external modules
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// parameters used on the express app
const PORT = process.env.PORT || process.env.npm_package_config_portData || 3100;

// express app creation
let app = express();

app.use(cors());                  // allow accessing from other external addresses
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({   // to support URL-encoded bodies
    extended: true
}));

// upload api routes
require('./routes/api')(app);

app.listen(PORT, () => console.log('data-server listening on port', PORT));