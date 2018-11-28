import Route from '@ember/routing/route';
import ENV from '../config/environment';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

import { inject as service } from '@ember/service';

/**
 * For development do not use authentication.
 * for other environments (production) user authentication.
 */
const DatasetsRoute = ENV.environment === 'development' ?
    Route.extend({ }) :
    Route.extend(AuthenticatedRouteMixin);

export default DatasetsRoute.extend({
    notify: service('notify'),

    model() {
        return this.get('store').findAll('dataset', { reload: true })
            .then(datasets => datasets.filter(dataset => dataset.get('status') !== 'in_queue'))
            .then(datasets => datasets.sortBy('created'))
            .then(datasets => {
                // add date to dataset
                for (let dataset of datasets) {
                    let created = dataset.get('created');
                    let date = `${created.getDate()}/${created.getMonth() + 1}/${created.getFullYear()}`;
                    dataset.set('date', date);

                    if (dataset.get('status') !== 'finished') {
                        // continuously check if dataset is loaded
                        let interval = setInterval(() => {
                            $.get(`${ENV.APP.HOSTNAME}/api/datasets/${dataset.get('id')}/status`)
                                .then(response => {
                                    // if data status changes
                                    if (response.status === 'finished') {
                                       this._ableToLoadDataset(dataset, interval, response);
                                    } else if (response.errors) {
                                        this._unableToLoadDataset(dataset, inverval);
                                    }
                                }).catch(error => {
                                    this._unableToLoadDataset(dataset, inverval);
                                });
                        }, 5000);
                    }
                }
                return datasets;
            });
    },


    _ableToLoadDataset(dataset, interval, response) {
         // clear the interval
         clearInterval(interval);
         this.get('notify').info({
             html: `<div class="notification">
                     Dataset <span class="label">
                         ${dataset.get('label')}
                     </span> successfully uploaded!
                 </div>`
         });
         // set dataset loaded property
         dataset.set('status', response.status);
    },


    _unableToLoadDataset(dataset, interval) {
        // clear the interval
        clearInterval(interval);
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
