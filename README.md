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

## Building the Project

- Clone the project using web URL `https://github.com/ErikNovak/InfoMiner.git`
    ```bash
    git clone https://github.com/ErikNovak/InfoMiner.git
    ```
- Run `npm install` to install project dependencies, e.g. `qminer`, `express`, `path` etc.
    ```bash
    npm install
    ```
    - Running `npm install` will automatically run `npm run preinstall` which installs global npm dependencies, e.g. `ember-cli` used for Ember web application development
        ```bash
        # installing global ember-cli
        npm run preinstall
        # same as running
        npm list ember-cli@2.16.2 -g || npm install ember-cli@2.16.2 -g
        ```
    - Additionally, it will automatically run `npm run postinstall` and install local ember dependencies. It is same as navigating to `src/server/website-source` and running `npm install`
        ```bash
        # running the command
        npm run postinstall
        # same as
        cd src/website/website-source
        npm install
        ```

### PostgresQL configuration

- Create a new PostgresQL database called `infominer` on development computer.
- Configure `./src/config/pgconfig.js` with your own credentials.
- Run `npm run postgres:create` to create postgres tables.
    ```bash
    npm run postgres:create
    ```

## Helpful commands

These commands can be used inside the project folder for quick use.

| command | description |
| ------- | ----------- |
| `npm test` | Runs unit tests. Command must be run in `bash`! |
| `npm run server:gui` | Runs `gui-server` located in `src/server`. The server is available on `PORT=3000`. |
| `npm run server:guiDebug`| Runs `gui-server` in `debug` mode. |