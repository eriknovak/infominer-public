// external modules
const async = require('async');

// prepare postgresql connection to the database
const pg = require('../lib/postgresQL')(require('../config/pgconfig'));

// prepare commands we want to execute
let commands = [
    'CREATE TABLE IF NOT EXISTS datasets (id serial PRIMARY KEY, creator varchar NOT NULL, label varchar NOT NULL, dir varchar NOT NULL, sourcefile varchar NOT NULL, created timestamp with time zone DEFAULT NOW());',
    'CREATE INDEX IF NOT EXISTS datasets_creator_idx ON datasets(creator);',
    'CREATE INDEX IF NOT EXISTS datasets_setname_idx ON datasets(label);',
    'CREATE INDEX IF NOT EXISTS datasets_timezone_idx ON datasets(created);'
];

// execute them one by one
async.eachSeries(
    commands,
    (command, callback) => {
        console.log(`Executing:\n ${command}`);
        pg.execute(
            command, [],
            (err) => {
                callback();
            }
        );
    },
    () => { console.log('Tables created'); pg.close(); }
);
