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
                                    } else if (response.errors) {
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
                                }).catch(error => {
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
                                });
                        }, 5000);
                    }
                }
                return datasets;
            });
    }

});
