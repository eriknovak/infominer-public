import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import $ from 'jquery';


export default Route.extend({
    fieldSelection: service('field-selection'),
    unloadExtra:    service('unload-extra'),

    model(params) {
        // unload subsets and methods
        let { dataset_id } = params;
        const namespace = `api/datasets/${dataset_id}`;
        // modify namespace for subset and method model
        let subsetAdapter = this.get('store').adapterFor('subset');
        let methodAdapter = this.get('store').adapterFor('method');
        let activeLearningAdapter = this.get('store').adapterFor('active-learning');

        // check if the namespace has changed
        if (subsetAdapter.get('namespace') !== namespace) {
            clearTimeout(methodAdapter.get('timeout'));
            let methods = this.get('store').peekAll('method');
            methods.forEach(record => {
                if (record.get('currentState.isSaving')) {
                    record.send('becameInvalid');
                }
            });
            // unload all data
            this.get('store').unloadAll();
            // set new namespace
            subsetAdapter.set('namespace', namespace);
            methodAdapter.set('namespace', namespace);
            activeLearningAdapter.set('namespace', `${namespace}/methods`);
        }
        return this.get('store').findRecord('dataset', params.dataset_id)
            .then(dataset => {
                // required to initialize service for that dataset
                this.get('fieldSelection').init();
                // return the dataset
                return dataset;
            });
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

        /**
         * Deletes the subset with the given id.
         * @param {Number | String} subsetId - The subset id.
         */
        deleteSubset(subsetId) {
            let self = this;

            let subset = this.get('store').peekRecord('subset', subsetId);
            self.modelFor('dataset').get('hasSubsets').removeObject(subset);
            // remove the subset from its creator method
            let method = subset.get('resultedIn');
            method.get('produced').removeObject(subset);

            let _methodDeleted = false;
            if (!method.get('produced.length')) {
                // remove method from the applied on subset
                method.set('appliedOn', null);
                // remove link between dataset and method
                self.modelFor('dataset').get('hasMethods').removeObject(method);
                this.get('store').peekRecord('method', method.get('id')).destroyRecord();
                _methodDeleted = true;
            }

            return subset.destroyRecord().then(() => {
                if (!_methodDeleted) {
                    this.get('store').peekRecord('method', method.get('id')).reload();
                }
                // if subset deleted through edit subset modal
                if ($('#edit-subset-modal').hasClass('show')) {
                    $('#edit-subset-modal').modal('toggle');
                }
                // hide the subset-delete-modal
                self.transitionTo('dataset.subset', self.modelFor('dataset').get('id'), 0);
            });
        },

        /**
         * Deletes the method with the given id.
         * @param {Number | String} methodId - The method id.
         */
        deleteMethod(methodId) {
            let self = this;

            let method = this.get('store').peekRecord('method', methodId);
            method.set('appliedOn', null);

            return method.destroyRecord().then(() => {
                self.transitionTo('dataset.subset', self.modelFor('dataset').get('id'), 0);
            });
        }

    }

});
