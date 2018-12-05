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
    datasetPending: false,

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
                url: `${ENV.APP.HOSTNAME}/api/datasets/`,
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
                // add a default value for fields
                model.fieldList.forEach(field => { field.invalid = false; });
                model.dataset.parameters = { stopwords: '' };
                this.set('controller.model', model);
                this.set('datasetPending', true);
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
         */
        submitDataset() {
            // get route model values
            let { dataset, fieldList } = this.get('controller.model');

            const fieldIsInvalid = fieldList.filter(field => field.included)
                    .map(field => field.invalid.length > 0).includes(true);

            if (fieldIsInvalid) {
                $('.dataset-upload-info-container__actions--warning').addClass('show');
                return;
            }

            // filter out the included fields and prepare the array as
            // set the options and upload
            $.post({
                url: `${ENV.APP.HOSTNAME}/api/datasets/${dataset.id}`,
                data: {
                    dataset: JSON.stringify(dataset),
                    fields: JSON.stringify(fieldList)
                }
            }).then(() => {
                run(() => {
                    this.set('datasetPending', false);
                    this.transitionTo('datasets');
                });
            });

        },

        willTransition() {
            // cancel task if still existant
            if (this.task) { this.task.cancel(); }
            if (this.get('datasetPending')) {
                this._removeDataset();
            }
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
                url: `${ENV.APP.HOSTNAME}/api/datasets/${dataset.id}`,
                type: 'DELETE'
            });
            this.set('controller.model', null);
        }
        // get the dataset queue and set them all to null
        const uploader = this.get('uploader');
        let queue = uploader.find('dataset');
        if (queue) {
            queue.get('files').forEach((file) => file.set('queue', null));
            queue.set('files', A());
        }
        this.set('datasetPending', false);
    }

});

