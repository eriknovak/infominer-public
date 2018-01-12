// external modules
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport'); // the main authentication module
const session = require('express-session'); // maintaining sessions

// internal modules
const pg = require('../lib/postgresQL')(require('../config/pgconfig')); // postgres connection
// contains the process handler class
const ProcessHandler = require('../lib/processHandler');
// parameters used on the express app
const PORT = process.env.PORT || process.env.npm_package_config_portGui || 3000;

let processHandler = new ProcessHandler({
    processPath: path.join(__dirname, '/child_process/dataset.js'),
    cleanupMilliseconds: 30*60*1000, // 30 minutes
    processMaxAge: 2*60*60*1000 // 2 hours
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

app.use(cors());                // allow accessing from other external addresses
app.use(cookieParser());        // to support cookie parsing
app.use(bodyParser.json());     // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));

// session maintainance
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // if secure: `true` will make req.user = undefined if not in https protocol
}));

// passport configuration
require('../lib/passport')(passport);

// initialize authentication
app.use(passport.initialize());
app.use(passport.session());

// set where are public files
app.use(express.static(__dirname + '/public/'));

// handle login routes
require('./routes/login')(app, passport);
// handle api routes
require('./routes/api/v1')(app, pg, processHandler);

// handle ember web application
// IMPORTANT: must be after all routes
app.get('*', (req, res) => {
    return res.sendFile('./public/index.html', { root: __dirname });
});

// run the express app
app.listen(PORT, () => console.log('gui-server listening on port', PORT));