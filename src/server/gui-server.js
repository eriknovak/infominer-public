// external modules
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session'); // maintaining sessions

// internal modules
const pg = require('../lib/postgresQL')(require('../config/pgconfig')); // postgres connection

// parameters given to the process
const argv = require('minimist')(process.argv.slice(2));

// internal modules
const Logger = require('../lib/logging-handler')();
// create a logger instance for logging API requests
const logger = Logger.createGroupInstance('api_requests', 'api');

// parameters used on the express app
const PORT = argv.PORT || 3000;

// contains the process handler class
const ProcessHandler = require('../lib/process-handler');
// create an instance of the process handler
let processHandler = new ProcessHandler({
    processPath: path.join(__dirname, '/child-process/dataset.js'),
    cleanupMilliseconds: 30*60*1000, // 30 minutes
    processMaxAge:     2*60*60*1000  // 2 hours
});

// on manual process exit
process.on('SIGINT', () => {
    if (process.platform === 'win32') {
        processHandler.closeAllProcesses(() => {
            pg.close(() => {
                // close postgresql connection
                logger.info('close postgresql connection and stop server');
                process.exit(0);
            });
        });
    } else {
        pg.close(() => {
            // close postgresql connection
            logger.info('close postgresql connection and stop server');
            process.exit(0);
        });
    }
});

// express app creation
let app = express();


app.use(cors()); // allow accessing from other external addresses
app.use(cookieParser()); // to support cookie parsing
app.use(bodyParser.json({limit: '50mb'})); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    limit: '50mb',
    extended: true
}));

// session maintainance
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // if secure: `true` will make req.user = undefined if not in 'https' protocol
}));

// set where are public files
app.use(express.static(__dirname + '/public/'));

// set login & API routes
require('./routes/route.handler')(app, pg, processHandler, logger);

// handle ember web application
// IMPORTANT: must be after all routes
app.get('*', (req, res) => {
    return res.sendFile('./public/index.html', { root: __dirname });
});

// run the express app
app.listen(PORT, () => logger.info(`infominer listening on port ${PORT}`));