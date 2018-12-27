# InfoMiner

InfoMiner is an semi-automatic exploration tool. It enables the user to create topic
ontologies by clustering, labelling and querying textual documents. If works as a web application, but will run only on the local machine.

## Prerequisites

To use the InfoMiner service, you must first install the following software on your machine:

- **Node.js**. This engine enables running JavaScript files and is required for running the InfoMiner service. The installation file is available [here](https://nodejs.org/en/download/). By installing Node.js you will also install the Node Package Manager (npm) which is used to install node modules (similar as pip in Python).

- **PostgresQL**. This is an open source object-relational database system. It is used to store the metadata of the datasets uploaded to InfoMiner. The installation files are found [here](https://www.postgresql.org/download/).

- **Git** (optional). Git is a free and open source distributed version control system. It is used to acquire and update InfoMiner.

## Setting Up the Service

1. `Clone` or download the service source code (in .zip) onto your computer.

    **Git**. Run the following command to clone the project repository unto your computer.
    ```bash
    git clone https://github.com/ErikNovak/infominer-public.git
    ```

2. Install all project dependencies, e.g. `qminer`, `express`, `path` etc, by running the following command.
    ```bash
    npm install
    ```

3. Create a postgresQL database called infominer.

    **Windows**. In the command line (cmd) run the following command.
    ```bash
    createdb infominer
    ```
    **Linux**. In bash you must first change the user to `postgres` and then create the database.
    ```bash
    sudo su - postgres
    createdb infominer
    exit
    ```

4. Create a file named `pgconfig.js` in the `/src/config` folder which contains the following configuration
    ```javascript
    module.exports = {
        user: 'postgres',        // insert user name
        database: 'infominer',
        password: '###########', // insert user password
        host: 'localhost',
        port: 5432,              // insert port specified when you installed postgresQL
        max: 10,
        idleTimeoutMillis: 30000
    };
    ```

5. Create the required postgresQL tables. This is done by executing the following command.
    ```bash
    npm run postgres:create
    ```
    The command shown executes the file `/src/load/create-postgres-tables.js`.

6. Run InfoMiner by executing the following command in the command line.
    ```bash
    npm run server:gui
    ```
    The service will then be available in the browser at the address `localhost:3000`.

    - **Stopping the Service**. To stop the service you press `ctrl+c` to stop the server running InfoMiner. *Important:* you must wait until the service closes all of the datasets before completely stopping. It will notify the user in the command line when a dataset has been closed.


