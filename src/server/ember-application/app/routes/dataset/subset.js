import Route from '@ember/routing/route';

export default Route.extend({

    model(params) {
        // get the subset info
        return this.get('store').findRecord('subset', params.subset_id);
    },

    actions: {

        /**
         * Submits the changes to the subset information.
         */
        submitSubsetInfo() {
            // get subset label and description
            let label = Ember.$('#edit-subset-modal input').val();
            let description = Ember.$('#edit-subset-modal textarea').val();

            // get warning and clean container
            let warningContent = Ember.$('#edit-subset-modal div.warning');
            warningContent.empty();

            if (label.length === 0) {
                // TODO: handle data omitence
                warningContent.append('<p class="warning-content">Subset label must be given!</p>');
            } else {
                // get the current subset
                let subset = this.modelFor(this.routeName);

                // set the subset information
                subset.set('label', label);
                subset.set('description', description);

                // save the subset for persistance
                subset.save();
                Ember.$('#edit-subset-modal').modal('toggle');
            }
        },

        removeModalWarnings() {
            // get warning container
            let warningContent = Ember.$('#edit-subset-modal div.warning');
            // empty warning container
            warningContent.empty();
        }

    }

});
