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

    didReceiveAttrs() {
        this._super(...arguments);
        // get cluster id and set subset name
        let cluster = this.get('cluster');
        let subsetName = cluster.label != null ? cluster.label : 'Subset';
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
                description: this.get('subsetDescription'),
                modalId: this.get('elementId'),
                methodId: this.get('methodId'),
                clusterId: this.get('clusterId'),
                documentCount: this.get('cluster.documentCount')
            };
            // make it loading
            $(`#${this.elementId} .modal-footer .btn-primary`).html(
                '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i>'
            );

            // invoke the route action on subset info
            this.get('createSubset')(subsetInfo);
        }
    }

});
