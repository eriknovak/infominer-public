import Route from '@ember/routing/route';
import ENV from '../config/environment';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import { inject as service } from '@ember/service';
import $ from 'jquery';

/**
 * For development do not use authentication.
 * for other environments (production) user authentication.
 */
const DatasetRoute = ENV.environment === 'development' ?
    Route.extend({ }) :
    Route.extend(AuthenticatedRouteMixin);

export default DatasetRoute.extend({

    unloadExtra: service('unload-extra'),

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
        },

        deleteSubset(subsetId) {
            let self = this;
            $('#delete-subset-modal .modal-footer .btn-danger').html(
                '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i>'
            );
            let subset = this.get('store').peekRecord('subset', subsetId);
            // this subset is the root subset - cannot delete it
            self.modelFor('dataset').get('hasSubsets').removeObject(subset);
            subset.destroyRecord().then(() => {
                // reload dataset model
                self.modelFor('dataset').reload().then((response) => {
                    self.get('unloadExtra.unload')(response, self.get('store'), 'method');
                    self.get('unloadExtra.unload')(response, self.get('store'), 'subset');
                    self.modelFor('dataset').reload().then(() => {
                        // if subset deleted through edit subset modal
                        if ($('#edit-subset-modal').hasClass('show')) {
                            $('#edit-subset-modal').modal('toggle');
                        } 
                        // hide the subset-delete-modal
                        $('#subset-delete-modal').modal('toggle');
                        $('#subset-delete-modal .modal-footer .btn-danger').html('Yes, delete subset');
                        let datasetId = parseInt(self.modelFor('dataset').get('id'));
                        self.transitionTo('dataset.subset', datasetId, 0);
                    });
                });
            });
        }

    }

});
