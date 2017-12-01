import Component from '@ember/component';

export default Component.extend({
    classNames: ['modal', 'fade'],
    attributeBindings: ['tabindex', 'role'],
    tagName: 'div',
    tabindex: -1,
    role: 'dialog',

    ///////////////////////////////////////////////////////
    // Default values
    ///////////////////////////////////////////////////////

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
        changeSubsetName() {
            this.set("subsetName", Ember.$(`#${this.get('id')} input`).val());
        },

        changeSubsetDescription() {
            this.set("subsetDescription", Ember.$(`#${this.get('id')} textarea`).val());
        },

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
