import Component from '@ember/component';

export default Component.extend({

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        //set new dataset label & description
        this.set('datasetLabel', this.get('dataset.label'));
        this.set('datasetDescription', this.get('dataset.description'));
    },

    didReceiveAttrs() {
        this._super(...arguments);
        // modify date to appropriate format
        this._prepareDate();
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        /**
         * Change dataset label.
         */
        changeDatasetLabel() {
            this.set('datasetLabel', Ember.$(`#edit-dataset-modal input`).val());
        },

        /**
         * Change dataset description.
         */
        changeDatasetDescription() {
            this.set('datasetDescription', Ember.$(`#edit-dataset-modal textarea`).val());
        },

        /**
         * Submit dataset info changes.
         */
        submitDatasetChanges() {

            // get warning and clean container
            let warningContent = Ember.$('#edit-dataset-modal div.warning');
            warningContent.empty();

            if (this.get('datasetLabel').length === 0) {
                // TODO: notify the user the subset label is missing
                warningContent.append('<p class="warning-content">Dataset label must be given!</p>');
            } else {
                // set dataset info
                this.set('dataset.label', this.get('datasetLabel'));
                this.set('dataset.description', this.get('datasetDescription'));
                // submit changes made to the dataset
                Ember.$('#edit-dataset-modal').modal('toggle');
                this.get('dataset').save();
            }
        },

        /**
         * Remove the modal warnings.
         */
        removeModalWarnings() {
            // get warning container
            let warningContent = Ember.$('#edit-dataset-modal div.warning');
            // empty warning container
            warningContent.empty();
        }
    },

    ///////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////

    /**
     * Change date to dd/mm/YYYY format
     */
    _prepareDate() {
        const c = this.get('dataset.created');
        let date = `${c.getDate()}/${c.getMonth() + 1}/${c.getFullYear()}`;
        this.set('dataset.date', date);
    }

});
