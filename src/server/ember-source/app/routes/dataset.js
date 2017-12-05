import Route from '@ember/routing/route';

export default Route.extend({

    model(params) {
        // unload subsets and methods
        let { dataset_id } = params;
        const namespace = `api/datasets/${dataset_id}`;
        // modify namespace for subset and method model
        let subsetAdapter = this.store.adapterFor('subset');
        let methodAdapter = this.store.adapterFor('method');

        // check if the namespace has changed
        if (subsetAdapter.get('namespace') !== namespace) {
            // unload all data
            this.get('store').unloadAll();
            // set new namespace
            subsetAdapter.set('namespace', namespace);
            methodAdapter.set('namespace', namespace);
        }
        // get data
        return this.get('store').findRecord('dataset', params.dataset_id, { reload: true });
    },

    actions: {
        /**
         * Deletes the dataset from the user library.
         */
        deleteDataset() {
            let model = this.modelFor(this.routeName);
            // delete dataset and send to backend
            // calls DELETE /api/datasets/:dataset_id
            model.destroyRecord()
                .then(() => {
                    // remove modal backdrop and redirect to dataset library
                    Ember.$('.modal-backdrop').remove();
                    this.transitionTo('datasets');
                });
        }

    }

});
