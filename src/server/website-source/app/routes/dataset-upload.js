import Route from '@ember/routing/route';
import ENV from '../config/environment';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

import { inject as service } from '@ember/service';
import { run } from '@ember/runloop';
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
            this.task = file.upload({
                url: `${ENV.APP.HOSTNAME}/api/datasets/temporary_file`,
            }).then(response => {
                let model = response.body;
                // set dataset model for storing information
                if (model.errors) {
                    this.get('notify').info({
                        html: `<div class="notification">
                                <span class="fa fa-exclamation-circle"></span>
                                Error when uploading file <span class="label">
                                    ${model.errors.filename}
                                </span>: ${model.errors.msg}!
                            </div>`
                    });
                    return this._removeDataset();
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
            this._removeDataset();
        },

        /**
         * Pushes metadata and file blob to server.
         * @param {Object} file - File blob.
         */
        submitDataset() {
            // get route model values
            let { dataset, fieldList } = this.get('controller.model');

            if (fieldList.filter(field => field.included)
                .map(field => field.invalid.length > 0).includes(true)) {
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
                            } else if (response.errors) {
                                // clear the interval
                                clearInterval(interval);
                                let dataset = this.get('store').peekRecord('dataset', data.datasetId);

                                this.get('notify').alert({
                                    html: `<div class="notification">
                                            Dataset <span class="label">
                                                ${dataset.label}
                                            </span> was unable to load!
                                        </div>`
                                });
                                // destroy the dataset
                                dataset.destroyRecord();
                            }
                        }).catch(error => {
                            // clear the interval
                            clearInterval(interval);
                            let dataset = this.get('store').peekRecord('dataset', data.datasetId);

                            this.get('notify').alert({
                                html: `<div class="notification">
                                        Dataset <span class="label">
                                            ${dataset.label}
                                        </span> was unable to load!
                                    </div>`
                            });
                            // destroy the dataset
                            dataset.destroyRecord();
                        });
                }, 3000);
                run(() => { this.transitionTo('datasets'); });
            });
        },

        willTransition(transition) {
            // cancel task if still existant
            if (this.task) { this.task.cancel(); }
            return true;
        }
    },

    // helper functions

    /**
     * Resets file queue.
     */
    _removeDataset() {
        // delete dataset file on the server side
        if (this.get('controller.model')) {
            // get dataset information
            let { dataset } = this.get('controller.model');
            $.ajax({
                url: `${ENV.APP.HOSTNAME}/api/datasets/temporary_file?filename=${dataset.filename}`,
                type: 'DELETE'
            });
            this.set('controller.model', null);
        }
        // get the dataset queue and set them all to null
        const uploader = this.get('uploader');
        let queue = uploader.find("dataset");
        if (queue) {
            queue.get('files').forEach((file) => file.set('queue', null));
            queue.set('files', A());
        }

    }

});

