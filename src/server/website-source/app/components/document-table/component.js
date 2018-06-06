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
        this.set('possibleLimits', [
            { value: 1,  selected: false },
            { value: 5,  selected: false },
            { value: 10, selected: false },
            { value: 25, selected: false },
            { value: 50, selected: false }
        ]);
    },


    didReceiveAttrs() {
        this._super(...arguments);

        // set documents, fields and pagination values
        this.get('metadata.fields').forEach(field => { 
            set(field, 'sortable', field.type !== 'string_v');
        });
        this.set('fields', this.get('metadata.fields'));
        this.set('query', this.get('metadata.query'));
        // table content rows
        this.set('loading-row-width', 1 + this.get('fields.length'));

        /*************************************
         * pagination navigation parameters
         ************************************/
        const pagination = this.get('metadata.pagination');

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

        /*************************************
         * pagination limit parameters
         ************************************/

        let possibleLimits = this.get('possibleLimits');
        // set the default limit value
        for (let option of possibleLimits) {
            if (option.value === limit) { set(option, 'selected', true); break; }
        }
        // save changes to possible limits
        this.set('possibleLimits', possibleLimits);
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
        },

        /**
         * Changes the number of documents shown in the table.
         */
        changeLimit() {
            // get new limit and use it
            let newLimit = parseInt(this.$('#table-show-limit').find(':selected').val());
            // execute new search
            this.get('changeLimit')(newLimit);
        }

    }

});
