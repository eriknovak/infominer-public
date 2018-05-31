import Component from '@ember/component';
import { computed, set } from '@ember/object';
import { htmlSafe } from '@ember/string';

export default Component.extend({

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        set(this, 'sortOptions', ['desc', 'asc']);
    },


    didReceiveAttrs() {
        this._super(...arguments);
        const model = this.get('model');
        // set documents, fields and pagination values
        this.set('documents', model);
        this.set('fields', model.get('meta.fields'));
        this.set('pagination', model.get('meta.pagination'));
        this.set('query', model.get('meta.query'));
        // table content rows
        this.set('loading-row-width', 1 + this.get('fields.length'));
    },

    columnWidth: computed('fields.length', function () {
        return htmlSafe(`width:${100 / this.get('fields.length')}%`);
    }),

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////


    actions: {
        /**
         * Set the sorting options.
         * @param {Number} index - The index of the selected field.
         */
        sortBy(index) {
            // get selected field
            let selectedField = this.get('fields').objectAt(index);

            // sort parameters
            let field = selectedField.name;
            // switch the sort type of the selected field
            let sortType = selectedField.sortType === 'desc' ? 
                this.get('sortOptions')[1] :
                this.get('sortOptions')[0];

            // run the action for sorting
            this.get('sortByField')({ field, sortType });

        }
    }

});
