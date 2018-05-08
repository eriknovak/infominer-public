import Component from '@ember/component';
import $ from 'jquery';

export default Component.extend({
    // component attributes
    classNames: ['modal', 'fade'],
    attributeBindings: ['tabindex', 'role'],
    tagName: 'div',
    tabindex: -1,
    role: 'dialog',

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        this.set('subsetName', 'Subset');
        this.set('subsetDescription', '');
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        /**
         * Change subset name.
         */
        changeSubsetName() {
            this.set('subsetName', $(`#${this.get('id')} input`).val());
        },

        /**
         * Change subset description.
         */
        changeSubsetDescription() {
            this.set('subsetDescription', $(`#${this.get('id')} textarea`).val());
        },

        /**
         * Save the subset.
         */
        saveSubset() {
            // prepare subset info object
            const subsetInfo = {
                label: this.get('subsetName'),
                description: this.get('subsetDescription')
            };
            // invoke the route action on subset info
            this.get('createSubset')(subsetInfo);
        }
    }

});
