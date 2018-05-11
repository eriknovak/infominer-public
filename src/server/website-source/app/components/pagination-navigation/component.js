import Component from '@ember/component';

export default Component.extend({
    // component attributes
    classNames: ["table-pagination"],

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didReceiveAttrs() {
        this._super(...arguments);
        const pagination = this.get('pagination');

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
            if (pageN > lastPage) { break; } // other pages are larger

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

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        /**
         * Gets the documents on the requested page.
         * @param {Number} pageNumber - The requested page.
         */
        getDocuments(pageNumber) {
            // get new limit and use it
            let changePage = this.get('changePage');
            // execute new search
            changePage(pageNumber);
        }



    }

});
