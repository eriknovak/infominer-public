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
        this.set('visualizationType', this.get('method.parameters.method.type').replace(/-/g, ' '));
    },

    actions: {
        toggleInformation() { this.toggleProperty('collapsed'); }
    }

});
