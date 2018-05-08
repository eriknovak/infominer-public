import Route from '@ember/routing/route';
import ENV from '../config/environment';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

import { inject as service } from '@ember/service';
import { run } from '@ember/runloop';
import { set } from '@ember/object';
import { A } from '@ember/array';
import $ from 'jquery';

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
                url: `${ENV.APP.HOSTNAME}/api/datasets/temporary_file`,
            }).then(response => {
                let model = response.body;
                // set dataset model for storing information
                if (model.errors) {
                    this.get('notify').info({
                        html: `<div class="notification">
                                <span class="fa fa-exclamation-circle"></span>
                                Uploaded file <span class="label">
                                    ${model.errors.filename}
                                </span> is not in correct format!
                            </div>`
                    });
                    return this.removeDataset();
                }
                // set all fields to valid - modify values in child components
                model.fieldList.forEach(field => { field.invalid = false; });
                this.set('controller.model', model);
            });
        },

        /**
         * Resets model and file queue.
         */
        resetModel() {
            // reset the model
            this.removeDataset();
        },

        /**
         * Pushes metadata and file blob to server.
         * @param {Object} file - File blob.
         */
        submitDataset() {
            // get route model values
            let { dataset, fieldList } = this.get('controller.model');

            if (fieldList.map(field => field.invalid).includes(true)) {
                $('#submittion-error').addClass('show');
                return;
            }

            // filter out the included fields and prepare the array as
            // set the options and upload
            $.post({
                url: `${ENV.APP.HOSTNAME}/api/datasets`,
                data: {
                    dataset: JSON.stringify(dataset),
                    fields: JSON.stringify(fieldList)
                }
            }).then(data => {
                // continuously check if dataset is loaded
                let interval = setInterval(() => {
                    $.get(`${ENV.APP.HOSTNAME}/api/datasets/${data.datasetId}/check`)
                        .then(response => {
                            // if data loaded change state
                            if (response.loaded) {
                                // clear the interval
                                clearInterval(interval);
                                this.get('notify').info({
                                    html: `<div class="notification">
                                            Dataset <span class="label">
                                                ${response.label}
                                            </span> successfully loaded!
                                        </div>`
                                });

                                // set dataset loaded property
                                let dataset = this.get('store').peekRecord('dataset', response.id);
                                dataset.set('loaded', response.loaded);
                            }
                        });
                }, 3000);
                run(() => { this.transitionTo('datasets'); });
            });
        }
    },

    // helper functions

    /**
     * Resets file queue.
     */
    removeDataset() {
        // get dataset information
        let { dataset } = this.get('controller.model');
        // get the dataset queue and set them all to null
        const uploader = this.get('uploader');
        let queue = uploader.find("dataset");
        if (queue) {
            queue.get('files').forEach((file) => file.set('queue', null));
            queue.set('files', A());
        }
        // delete dataset file on the server side
        $.ajax({
            url: `${ENV.APP.HOSTNAME}/api/datasets/temporary_file?filename=${dataset.filename}`,
            type: 'DELETE'
        });
        this.set('controller.model', null);
    }

});

