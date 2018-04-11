// external modules
const async = require('async');

// prepare postgresql connection to the database
const pg = require('../lib/postgresQL')(require('../config/pgconfig'));

// prepare commands we want to execute
let commands = [
    `CREATE TABLE IF NOT EXISTS infominer_datasets (id serial PRIMARY KEY, owner varchar NOT NULL,
        dbPath varchar NOT NULL, label varchar NOT NULL, description varchar,
        created timestamp with time zone DEFAULT NOW(), loaded boolean DEFAULT FALSE);`,
    `CREATE TABLE IF NOT EXISTS infominer_temporary_files (id serial PRIMARY KEY,
        owner varchar NOT NULL, filepath varchar NOT NULL, filename varchar NOT NULL,
        uploaded timestamp with time zone DEFAULT NOW(), delimiter varchar NOT NULL);`,
    'CREATE INDEX IF NOT EXISTS infominer_datasets_creator_idx ON infominer_datasets(owner);',
    'CREATE INDEX IF NOT EXISTS infominer_datasets_id_idx ON infominer_datasets(id);',
    'CREATE INDEX IF NOT EXISTS infominer_temporary_files_creator_idx ON infominer_temporary_files(owner);',
    'CREATE INDEX IF NOT EXISTS infominer_temporary_files_filename_idx ON infominer_temporary_files(filename);'
];

// execute them one by one
async.eachSeries(
    commands,
    (command, callback) => {
        console.log(`Executing:\n ${command}`);
        pg.execute(
            command, [],
            (err) => {
                if (err) { console.log('Error on execution', err.message); }
                callback();
            }
        );
    },
    () => { console.log('Tables created'); pg.close(); }
);
