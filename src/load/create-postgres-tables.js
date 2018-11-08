// external modules
const async = require('async');

// prepare postgresql connection to the database
const pg = require('../lib/postgresQL')(require('../config/pgconfig'));

// prepare commands we want to execute
let commands = [
    `CREATE TABLE IF NOT EXISTS infominer_datasets (id serial PRIMARY KEY, owner varchar NOT NULL,
        dbPath varchar DEFAULT NULL, label varchar DEFAULT NULL, description varchar DEFAULT NULL,
        created timestamp with time zone DEFAULT NOW(), status varchar DEFAULT 'in_queue',
        parameters jsonb);`,
    'CREATE INDEX IF NOT EXISTS infominer_datasets_creator_idx ON infominer_datasets(owner);',
    'CREATE INDEX IF NOT EXISTS infominer_datasets_id_idx ON infominer_datasets(id);',

    // alterations to the postgresql tables
    'ALTER TABLE IF EXISTS infominer_datasets ADD COLUMN IF NOT EXISTS parameters jsonb;',
    'ALTER TABLE IF EXISTS infominer_datasets ALTER COLUMN dbPath DROP NOT NULL;',
    'ALTER TABLE IF EXISTS infominer_datasets ALTER COLUMN label DROP NOT NULL;'
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
