import Component from '@ember/component';

export default Component.extend({
    // component attributes
    classNames: ['container-fluid', 'dataset-field-list'],

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {

        /**
         * Set the model dataset name.
         */
        changeDatasetName() {
            this.set("dataset.label", Ember.$("#dataset-label").val());
        },

        /**
         * Set the model dataset description.
         */
        changeDatasetDescription() {
            this.set("dataset.description", Ember.$("#dataset-description").val());
        }
    }

});
