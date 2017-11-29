import Component from '@ember/component';

export default Component.extend({
    classNames: ["table-pagination"],

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didReceiveAttrs() {
        this._super(...arguments);
        const pagination = this.get('pagination');

        // set page, limit and count
        const page = pagination.page;
        this.set('page', page);
        this.set('limit', pagination.limit);
        this.set('count', pagination.documentCount);

        // page navigation
        this.set('firstPage', 1);
        this.set('prevPage', page-1);
        this.set('nextPage', page+1);
        // set last page
        let lastPage = this.count/this.limit;
        if (lastPage % 1 !== 0) { lastPage = Math.floor(lastPage) + 1; }
        this.set('lastPage', lastPage);

        // set other navigation values
        let quickSelect = [ ];
        for (let pageN = page - 2; pageN < page + 3; pageN++) {
            if (pageN < 1) { continue; }     // go to next page
            if (pageN > lastPage) { break; } // other pages are larger
            quickSelect.push(pageN);
        }
        this.set('quickSelect', quickSelect);

        // set condition values
        this.set('onFirstPage', page === 1);
        this.set('onLastPage', page === lastPage);

    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        getDocuments(pageNumber) {
            // get new limit and use it
            let changePage = this.get('changePage');
            // execute new search
            changePage(pageNumber);
        }



    }

});
