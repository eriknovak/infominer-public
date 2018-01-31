import Component from '@ember/component';

export default Component.extend({
    // component attributes
    tagName: 'tr',

    // how the
    sortOptions: ['desc', 'asc'],

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////



    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        /**
         * Set the sorting options.
         * @param {Number} index - The index of the selected field.
         */
        sortBy(index) {
            // get the fields describing the header
            let fields = this.get('fields');
            // get selected field
            let selectedField = fields.objectAt(index);

            // sort parameters
            let field = selectedField.name;
            let sortType = null;
            // switch the sort type of the selected field
            if (selectedField.sortType === 'desc') {
                sortType = this.get('sortOptions')[1];
            } else {
                sortType = this.get('sortOptions')[0];
            }

            // run the action for sorting
            this.get('sortByField')({ field, sortType });

        }
    }

});