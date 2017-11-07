import Component from '@ember/component';

export default Component.extend({
    classNames: ['container-fluid', 'dataset-field-list'],

    actions: {

        /**
         * Set the model dataset name.
         */
        changeDatasetName() {
            this.set("dataset.name", Ember.$("#dataset-name").val());
        }
    }

});
