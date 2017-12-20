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
    availableMethods: ['clustering.kmeans', 'clustering.lda'],
    selectedMethod: 'clustering.kmeans',

    renderComponentName: computed('selectedMethod', function () {
        return this.get('selectedMethod').replace(/\./g, '-');
    }),

    // method parameters
    methodParameters: { type: null, parameters: { } },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        changeMethodSelection() {
            this.set('selectedMethod', Ember.$(`#${this.get('methodSelectionId')}`).val());
        },

        startAnalysis() {
            let parameters = this.get('methodParameters');
            console.log(parameters);
            // this.get('action')(parameters);

        }
    }

});
