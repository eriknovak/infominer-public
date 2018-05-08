import Route from '@ember/routing/route';
import ENV from '../config/environment';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import $ from 'jquery';

/**
 * For development do not use authentication.
 * for other environments (production) user authentication.
 */
const DatasetRoute = ENV.environment === 'development' ?
    Route.extend({ }) :
    Route.extend(AuthenticatedRouteMixin);

export default DatasetRoute.extend({

    model(params) {
        // unload subsets and methods
        let { dataset_id } = params;
        const namespace = `api/datasets/${dataset_id}`;
        // modify namespace for subset and method model
        let subsetAdapter = this.get('store').adapterFor('subset');
        let methodAdapter = this.get('store').adapterFor('method');

        // check if the namespace has changed
        if (subsetAdapter.get('namespace') !== namespace) {
            // unload all data
            this.get('store').unloadAll();
            // set new namespace
            subsetAdapter.set('namespace', namespace);
            methodAdapter.set('namespace', namespace);
        }
        // get data
        return this.get('store').findRecord('dataset', params.dataset_id);
    },

    actions: {
        /**
         * Deletes the dataset from the user library.
         */
        deleteDataset() {
            // delete dataset and send to backend
            // calls DELETE /api/datasets/:dataset_id
            this.modelFor(this.routeName).destroyRecord().then(() => {
                // remove modal backdrop and redirect to dataset library
                $('#delete-dataset-modal').modal('toggle');
                this.transitionTo('datasets');
            });
        }

    }

});
