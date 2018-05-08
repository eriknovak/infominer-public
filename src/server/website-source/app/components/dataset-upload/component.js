import Component from '@ember/component';
import $ from 'jquery';

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
            this.set("dataset.label", $("#dataset-label").val().trim());
        },

        /**
         * Set the model dataset description.
         */
        changeDatasetDescription() {
            this.set("dataset.description", $("#dataset-description").val().trim());
        }
    }

});
