import Route from '@ember/routing/route';
import ENV from '../config/environment';

import { inject as service } from '@ember/service';
import $ from 'jquery';


export default Route.extend({
    notify: service('notify'),

    model() {
        // 1. get the datasets
        // 2. filter out datasets that are just `in_queue`
        // 3. sort the datasets by the time they were created
        // 4. prepare dataset attributes to show
        // 5. (optional) set an interval that checks the dataset status
        return this.get('store').findAll('dataset', { reload: true })
            .then(datasets => datasets.filter(dataset => dataset.get('status') !== 'in_queue'))
            .then(datasets => datasets.sortBy('created'))
            .then(datasets => {
                // handle each dataset and set their attributes
                datasets.forEach(dataset => {
                    // add date to dataset
                    let created = dataset.get('created');
                    let date = `${created.getDate()}/${created.getMonth() + 1}/${created.getFullYear()}`;
                    dataset.set('date', date);

                    if (dataset.get('status') !== 'finished') {
                        // continuously check if dataset is loaded
                        let interval = setInterval(() => {
                            $.get(`${ENV.APP.HOSTNAME}/api/datasets/${dataset.get('id')}/status`)
                                .then(results => {
                                    // if data status changes
                                    if (results.status === 'finished') {
                                        // update the loaded dataset
                                        this._setupLoadedDataset(dataset, interval, results.status);
                                    } else if (results.errors) {
                                        // notify the user about the dataset error
                                        this._unableToLoadDataset(dataset, interval);
                                    }
                                }).catch(error => {
                                    // notify the user about the dataset error
                                    this._unableToLoadDataset(dataset, interval);
                                });
                        }, 10000);
                    }
                });

                // return the datasets
                return datasets;
            });
    },


    /**
     * Notifies the user about the dataset status and updates its object.
     * @param {Object} dataset - The dataset object.
     * @param {Object} interval - The interval object created with setInterval method.
     * @param {Object} status - The dataset loading status.
     */
    _setupLoadedDataset(dataset, interval, status) {
        // clear the interval
        clearInterval(interval);
        // notify user about the status
        this.get('notify').info({
            html: `<div class="notification">
                    Dataset <span class="label">
                        ${dataset.get('label')}
                    </span> successfully uploaded!
                </div>`
        });
        // set dataset loaded property
        dataset.set('status', status);
    },

    /**
     * Notifies the user the dataset was not able to load and destroy the object.
     * @param {Object} dataset - The dataset object.
     * @param {Object} interval - The interval object created with setInterval method.
     */
    _unableToLoadDataset(dataset, interval) {
        // clear the interval
        clearInterval(interval);
        // notify user about the status
        this.get('notify').alert({
            html: `<div class="notification">
                    Dataset <span class="label">
                        ${dataset.get('label')}
                    </span> was unable to load!
                </div>`
        });
        // destroy the dataset
        dataset.destroyRecord();
    }


});
