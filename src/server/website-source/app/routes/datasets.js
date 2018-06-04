import Route from '@ember/routing/route';
import ENV from '../config/environment';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

/**
 * For development do not use authentication.
 * for other environments (production) user authentication.
 */
const DatasetsRoute = ENV.environment === 'development' ?
    Route.extend({ }) :
    Route.extend(AuthenticatedRouteMixin);

export default DatasetsRoute.extend({

    model() {
        return this.get('store').findAll('dataset', { reload: true })
            .then(datasets => datasets.sortBy('created'))
            .then(datasets => {
                // add date to dataset
                for (let dataset of datasets) {
                    let created = dataset.get('created');
                    let date = `${created.getDate()}/${created.getMonth() + 1}/${created.getFullYear()}`;
                    dataset.set('date', date);
                }
                return datasets;
            });
    }

});
