# InfoMiner

InfoMiner is an exploration service for textual data.

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
    - Additionally, it will automatically run `npm run postinstall` and install local ember dependencies. It is same as navigating to `src/server/ember-source` and running `npm install`
        ```bash
        # running the command
        npm run postinstall
        # same as
        cd src/website/ember-source
        npm install
        ```

### PostgresQL configuration

- Create a new PostgresQL database called `infominer` on development computer.
- Configure `./src/config/pgconfig.js` with your own credentials.
- Run `npm run postgres:create` to create postgres tables.
    ```bash
    # creates tables and indeces
    npm run postgres:create
    ```

## Helpful commands

These commands can be used inside the project folder for quick use.

| command | description |
| ------- | ----------- |
| `npm test` | Runs unit tests. Command must be run in `bash`. |
| `npm run server:gui` | Runs `gui-server` located in `src/server`. The server is available on `PORT=3000`. |
| `npm run server:guiDebug`| Runs `gui-server` in `debug` mode. |

### Ember custom commands

Ember commands are here for easier Ember application development and building.

| command | description |
| ------- | ----------- |
| `npm run ember:serve` | Runs a development instance of `Ember` application on `http://localhost:4200`. The instance is in `development` mode and supports `live-reload`. |
| `npm run ember:build` | Builds the `Ember` application and saves it in `src/server/public` directory. |

