import Route from '@ember/routing/route';
import ENV from '../config/environment';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

import { inject as service } from '@ember/service';

/**
 * For development do not use authentication.
 * for other environments (production) user authentication.
 */
const DatasetUploadRoute = ENV.environment === 'development' ?
    Route.extend({ }) :
    Route.extend(AuthenticatedRouteMixin);


export default DatasetUploadRoute.extend({
    uploader: Ember.inject.service('file-queue'),
    notify: service('notify'),

    model() {
        this.resetQueue();
        // the initial model is null
        return null;
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        /**
         * Reads dataset and extracts the fields.
         * @param {Object} file - The file blob.
         */
        readDataset(file) {
            // save route object
            // TODO: handle reading with buffers
            file.readAsText().then((data) => {
                this.extractFields(file, data);
            });
        },

        /**
         * Resets model and file queue.
         */
        resetModel() {
            this.resetQueue();
            // reset the model
            this.set('controller.model', null);
        },

        /**
         * Pushes metadata and file blob to server.
         * @param {Object} file - File blob.
         */
        submitDataset(file) {
            // get route model values
            let { dataset, fieldList } = this.get('controller.model');
            // filter out the included fields and prepare the array as

            // set the options and upload
            file.upload({
                url: `${ENV.APP.HOSTNAME}/api/datasets/new`,
                data: {
                    dataset: JSON.stringify(dataset),
                    fields: JSON.stringify(fieldList)
                }
            }).then(data => {
                // continuously check if dataset is loaded
                let interval = setInterval(() => {
                    Ember.$.get(`${ENV.APP.HOSTNAME}/api/datasets/${data.body.datasetId}/check`)
                        .then(response => {
                            // if data loaded change state
                            if (response.loaded) {
                                // clear the interval
                                clearInterval(interval);
                                this.get('notify').info({
                                    html: `<div class="notification">
                                            Dataset <span class="database-label">
                                                '${response.label}'
                                            </span> successfully loaded!
                                        </div>`
                                });

                                // set dataset loaded property
                                let dataset = this.get('store').peekRecord('dataset', response.id);
                                dataset.set('loaded', response.loaded);
                            }
                        });
                }, 3000);
                this.transitionTo('datasets');
            });
        }
    },

    // helper functions

    /**
     * Extracts fields, types and update the route model.
     * @param {String} file - The file blob object.
     * @param {String} data - The file/data containing the table.
     */
    extractFields: function (file, data) {
        // separate rows and take first row as field names
        const tableRows = data.split(/\r\n?|\n/g);
        const fields = tableRows[0].split('|');

        let limit = fields.length > 100 ? 100 : fields.length;
        let fieldTypes = fields.map(() => 'float');

        for (let i = 1; i < limit; i++) {
            // if all fields are strings - end array
            if (fieldTypes.every(type => type === 'string')) { break; }
            // document row values
            let values = tableRows[1].split('|');
            for (let j = 0; j < values.length; j++) {
                let value = values[j];
                // check if value is a float
                // TODO: handle examples like '1aa212'
                if (isNaN(parseFloat(value))) { fieldTypes[j] = 'string'; }
            }
        }

        // TODO: set field type recommendation
        let fieldList = [];
        for (let i = 0; i < fields.length; i++) {
            fieldList.push({ name: fields[i], type: fieldTypes[i], included: true });
        }

        // get dataset name, size and number of documents
        let label = file.get('name');
        let size = file.get('size');
        let numDocs = tableRows.length - 1;
        // set model of this route
        this.set('controller.model', { file, dataset: { label, size, numDocs, description: "" }, fieldList });
    },

    /**
     * Resets file queue.
     */
    resetQueue: function () {
        // get the dataset queue and set them all to null
        const uploader = this.get('uploader');
        let queue = uploader.find("dataset");
        if (queue) {
            queue.get('files').forEach((file) => file.set('queue', null));
            queue.set('files', Ember.A());
        }
    }

});

