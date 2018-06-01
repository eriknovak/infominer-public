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
        this.set('query', model.get('meta.query'));
        // table content rows
        this.set('loading-row-width', 1 + this.get('fields.length'));

        /*************************************
         * pagination navigation parameters
         ************************************/
        const pagination = model.get('meta.pagination');

        // set page, limit and count
        const page = pagination.page;
        const limit = pagination.limit;
        const count = pagination.documentCount;

        this.set('page', page);
        this.set('limit', limit);
        this.set('count', count);

        // page navigation
        this.set('firstPage', 1);
        this.set('prevPage', page-1);
        this.set('nextPage', page+1);
        
        // set last page
        let lastPage = count/limit;
        if (lastPage % 1 !== 0) { lastPage = Math.floor(lastPage) + 1; }
        this.set('lastPage', lastPage);

        // set other navigation values
        let quickSelect = [ ];
        for (let pageN = page - 2; pageN < page + 3; pageN++) {
            if (pageN < 1) { continue; }     // go to next page
            if (pageN > lastPage) { break; } // other pages are greater
            quickSelect.push({ pageN, active: pageN === page });
        }
        this.set('quickSelect', quickSelect);

        // set condition values
        this.set('onFirstPage', page === 1);
        this.set('onLastPage', page === lastPage);

        // how many documents are shown
        const startDisplay = count ? 1 + (page-1)*limit : 0;
        const endDisplay = page*limit > count ? count : page*limit;

        // set display information
        this.set('startDisplay', startDisplay);
        this.set('endDisplay', endDisplay);

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
        },

        /**
         * Gets the documents on the requested page.
         * @param {Number} page - The requested page.
         */
        getDocuments(page) {
            // change page
            this.get('changePage')(page);
        }

    }

});
