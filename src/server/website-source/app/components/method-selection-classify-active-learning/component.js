import Component from '@ember/component';
import { set } from '@ember/object';

export default Component.extend({
    // component attributes

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        // set default cluster number
        // set possible clustering types
        set(this, 'queryText', '');
    },

    didReceiveAttrs() {
        this._super(...arguments);
        // set the parameters of the method
        this.set('type', { type: 'string' });
        this._setParameters();
    },

    ///////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////

    _setParameters() {
        // set parameter values
        this.set('parameters.method', {
            queryText: this.get('queryText')
        });
    }
});
