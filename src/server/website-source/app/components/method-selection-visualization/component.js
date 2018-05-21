import Component from '@ember/component';
import { set } from '@ember/object';

export default Component.extend({


    init() {
        this._super(...arguments);
        set(this, 'availableVisualizations', [
            { type: 'radial-tree', name: 'Radial Tree' },
        ]);
        set(this, 'selectedVisualization', this.get('availableVisualizations').objectAt(0).type);
    },

    didReceiveAttrs() {
        this._super(...arguments);
        // set the parameters of the method
        this._setParameters();
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        // change the method options
        changeVisualization(value) {
            this.set('selectedVisualization', value);
        }
    },

    _setParameters() {
        // set parameter values
        this.set('parameters.method', { type: this.get('selectedVisualization') });
    }

});
