import Component from '@ember/component';
import { computed, get, set } from '@ember/object';
import $ from 'jquery';

export default Component.extend({
    // component attributes
    classNames: ['modal', 'fade', 'analysis-modal'],
    attributeBindings: ['tabindex', 'role'],
    tagName: 'div',
    tabindex: -1,
    role: 'dialog',

    renderComponentName: computed('selectedMethod', function () {
        return this.get('selectedMethod').replace(/\./g, '-');
    }),

    init() {
        this._super(...arguments);
        set(this, 'selectedMethod', 'clustering.kmeans');
        set(this, 'availableMethods', [
            { method: 'clustering.kmeans', name: 'clustering' }
        ]);
        set(this, 'methodSelectionId', 'method-selection');
        set(this, 'parameters', {});
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        // change the method options
        changeMethodSelection() {
            this.set('selectedMethod', $(`#${this.get('methodSelectionId')}`).val());
        },

        // send the method parameters to the user
        startAnalysis() {
            // get the parameters
            let parameters = this.get('parameters');
            // get feature parameters
            let fields = get(parameters, 'features').filterBy('included', true)
                .map(param => get(param, 'field'));
            // get method parameters
            let method = get(parameters, 'method');
            // get the method type
            let methodType = this.get('selectedMethod');
            // send the parameters to the route
            this.get('action')({ methodType, parameters: { fields, method } });

        }
    }

});
