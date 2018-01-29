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
    uploader: service('file-queue'),
    notify: service('notify'),

    model() {
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
        uploadDataset(file) {
            // set the options and upload
            file.upload({
                url: `${ENV.APP.HOSTNAME}/api/datasets/uploadTemp`,
            }).then(data => {
                // set dataset model for storing information
                let model = data.body;
                this.set('controller.model', model);
            });
        },

        /**
         * Resets model and file queue.
         */
        resetModel() {
            this.removeDataset();
            // reset the model
            this.set('controller.model', null);
        },

        /**
         * Pushes metadata and file blob to server.
         * @param {Object} file - File blob.
         */
        submitDataset() {
            // get route model values
            let { dataset, fieldList } = this.get('controller.model');
            // filter out the included fields and prepare the array as
            // set the options and upload
            Ember.$.post({
                url: `${ENV.APP.HOSTNAME}/api/datasets`,
                data: {
                    dataset: JSON.stringify(dataset),
                    fields: JSON.stringify(fieldList)
                }
            }).then(data => {
                // continuously check if dataset is loaded
                let interval = setInterval(() => {
                    Ember.$.get(`${ENV.APP.HOSTNAME}/api/datasets/${data.datasetId}/check`)
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
     * Resets file queue.
     */
    removeDataset: function () {
        // get the dataset queue and set them all to null
        const uploader = this.get('uploader');
        let queue = uploader.find("dataset");
        if (queue) {
            queue.get('files').forEach((file) => file.set('queue', null));
            queue.set('files', Ember.A());
        }
    }

});

