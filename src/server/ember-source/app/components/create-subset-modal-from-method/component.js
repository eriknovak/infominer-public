import Component from '@ember/component';

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

    didReceiveAttrs() {
        this._super(...arguments);
        // get cluster id and set subset name
        let clusterId = this.get('clusterId');
        let subsetName = clusterId != null ? `Cluster #${clusterId+1}` : 'Subset';
        // set parameters
        this.set('subsetName', subsetName);
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
            this.set('subsetName', Ember.$(`#${this.get('id')} input`).val());
        },

        /**
         * Change subset description.
         */
        changeSubsetDescription() {
            this.set('subsetDescription', Ember.$(`#${this.get('id')} textarea`).val());
        },

        /**
         * Save the subset.
         */
        saveSubset() {
            // prepare subset info object
            const subsetInfo = {
                label: this.get('subsetName'),
                description: this.get('subsetDescription'),
                modalId: this.get('elementId'),
                methodId: this.get('methodId'),
                clusterId: this.get('clusterId')
            };
            // invoke the route action on subset info
            this.get('createSubset')(subsetInfo);
        }
    }

});