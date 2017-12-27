import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
    // component attributes
    classNames: ['modal', 'fade', 'analysis-modal'],
    attributeBindings: ['tabindex', 'role'],
    tagName: 'div',
    tabindex: -1,
    role: 'dialog',

    methodSelectionId: 'method-selection',

    // method options
    availableMethods: ['clustering.kmeans'],
    selectedMethod: 'clustering.kmeans',

    renderComponentName: computed('selectedMethod', function () {
        return this.get('selectedMethod').replace(/\./g, '-');
    }),

    // method parameters
    parameters: { },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        // change the method options
        changeMethodSelection() {
            this.set('selectedMethod', Ember.$(`#${this.get('methodSelectionId')}`).val());
        },

        // send the method parameters to the user
        startAnalysis() {
            // get the parameters
            let parameters = this.get('parameters');
            // get feature parameters
            let features = Ember.get(parameters, 'features')
                .filterBy('included', true)
                .map(param => Ember.get(param, 'features'));
            // get method parameters
            let method = Ember.get(parameters, 'method');
            // get the method type
            let methodType = this.get('selectedMethod');
            // send the parameters to the route
            this.get('action')({ methodType, parameters: { features, method } });

        }
    }

});
