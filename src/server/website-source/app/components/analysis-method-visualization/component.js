import Component from '@ember/component';
import { set } from '@ember/object';

export default Component.extend({
    // component attributes
    classNames: ['analysis__component', 'analysis__component--visualization'],

    init() {
        this._super(...arguments);
        set(this, 'collapsed', false);
    },

    didReceiveAttrs() {
        this._super(...arguments);
        const visualizationType = this.get('method.parameters.method.type') === 'radial-tree' ?
            'topic ontology' : '';
        this.set('visualizationType', visualizationType);
    },

    actions: {
        toggleInformation() { this.toggleProperty('collapsed'); }
    }

});
