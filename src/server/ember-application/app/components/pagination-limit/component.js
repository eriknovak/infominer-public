import Component from '@ember/component';

export default Component.extend({
    // component attributes
    tagName: 'span',

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        this.set('possibleLimits', []);
    },

    didReceiveAttrs() {
        this._super(...arguments);
        // set default possible limits
        this.set('possibleLimits', [
            { value: 1, selected: false },
            { value: 5, selected: false },
            { value: 10, selected: false },
            { value: 25, selected: false },
            { value: 50, selected: false }
        ]);

        // get possible limits and change with the current one
        const limit = this.get('limit');
        let possibleLimits = this.get('possibleLimits');
        // set the default limit value
        for (let option of possibleLimits) {
            if (option.value === limit) { option.selected = true; break; }
        }
        // save changes to possible limits
        this.set('possibleLimits', possibleLimits);
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        /**
         * Changes the number of documents shown in the table.
         */
        changeLimit() {
            // get new limit and use it
            let newLimit = parseInt(this.$('#table-show-limit').find(':selected').val());
            let changeLimit = this.get('changeLimit');
            // execute new search
            changeLimit(newLimit);
        }

    }

});
