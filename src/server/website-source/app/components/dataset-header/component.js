import Component from '@ember/component';
import { inject as service } from '@ember/service';
import $ from 'jquery';

export default Component.extend({
    fieldSelection: service('field-selection'),

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        //set new dataset label & description
        this.set('label', this.get('dataset.label'));
        this.set('description', this.get('dataset.description'));
    },

    didReceiveAttrs() {
        this._super(...arguments);
        // modify date to appropriate format
        this._prepareDate();
    },

    didInsertElement() {
        let self = this;
        self._super(...arguments);
        $(`#${self.get('elementId')} .dropdown-menu`).click(function(e) {
            e.stopPropagation();
        });
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        /**
         * Change dataset label.
         */
        editLabel() {
            this.set('label', $(`#edit-dataset-modal input`).val());
        },

        /**
         * Change dataset description.
         */
        editDescription() {
            this.set('description', $(`#edit-dataset-modal textarea`).val());
        },

        /**
         * Submit dataset info changes.
         */
        updateDataset() {

            // get warning and clean container
            let warning = $('#edit-dataset-modal div.warning');
            warning.empty();

            if (this.get('label').length === 0) {
                // TODO: notify the user the subset label is missing
                warning.append('<p class="warning-content">Dataset label must be given!</p>');
            } else {
                // update dataset attributes
                this.set('dataset.label', this.get('label'));
                this.set('dataset.description', this.get('description'));
                // submit changes made to the dataset
                $('#edit-dataset-modal').modal('toggle');
                this.get('dataset').save();
            }
        },

        /**
         * Remove the modal warnings.
         */
        removeWarnings() {
            $('#edit-dataset-modal div.warning').empty();
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
