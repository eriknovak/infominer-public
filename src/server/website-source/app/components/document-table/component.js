import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, set } from '@ember/object';
import { htmlSafe } from '@ember/string';
import $ from 'jquery';


export default Component.extend({
    classNames: ['row', 'document-table'],

    fieldSelection: service('field-selection'),
    store: service('store'),

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

            const sorting_order = field.sortType === 'desc' ? 'down' : field.sortType === 'asc' ? 'up' : null;
            set(field, 'sorting_order', sorting_order);
        });
        this.set('query', this.get('metadata.query'));
        // table content rows
        this.set('loading-row-width', 1 + this.get('metadata.fields')
            .filter(field => field.showInTable).length);

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
        this.set('onFirstPage', page === 1 || !count);
        this.set('onLastPage', page === lastPage || !count);

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

    didInsertElement() {
        let self = this;
        self._super(...arguments);
        $(`#${self.get('elementId')} .dropdown-menu`).click(function(e) {
            e.stopPropagation();
        });
    },

    columnWidth: computed('metadata.fields.@each.showInTable', function () {
        // get element total width
        let totalWidth = $(`#${this.elementId} .table-responsive`).width();
        // get number of fields shown
        let shownFields = this.get('metadata.fields')
            .filter(field => field.showInTable).length;
        // get width factor
        let width = totalWidth / shownFields;

        // calculate header width
        let headerWidth = width > 160 ? width : 160;

        return htmlSafe(`min-width:${headerWidth-10}px;`);
    }),

    numberOfFieldsShown: computed('metadata.fields.@each.showInTable', function () {
        this.get('metadata.fields').forEach(field => {
            this.get('fieldSelection').showFieldInTable(field.id, field.showInTable);
        });
        return this.get('metadata.fields').filter(field => field.showInTable).length;
    }),

    siblingSubsets: computed('subset', function () {
        const subset = this.get('subset');
        if (!subset) return null;
        if (!subset.belongsTo('resultedIn').value()) return null;

        // return the sibling subsets
        return subset.get('resultedIn').get('produced')
            .filter(sibling => sibling.get('id') !== subset.get('id'));
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
            let selectedField = this.get('metadata.fields').objectAt(index);
            // sort parameters
            let field = selectedField.name;
            // switch the sort type of the selected field
            let sortType = selectedField.sorting_order === 'down' ?
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
            let newLimit = parseInt($('#table-show-limit').find(':selected').val());
            // execute new search
            this.get('changeLimit')(newLimit);
        },

        moveDocuments(subsetId) {
            this.get('moveDocuments')(subsetId);
        },

        deleteDocuments() {
            // activate the route action
            this.get('deleteDocuments')();
        }

    }

});
