import Route from '@ember/routing/route';

export default Route.extend({

    model(params) {
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
