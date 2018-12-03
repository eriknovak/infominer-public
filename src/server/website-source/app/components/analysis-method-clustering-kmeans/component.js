import Component from '@ember/component';
import { set } from '@ember/object';


export default Component.extend({
    // component attributes
    classNames: ['analysis__component', 'analysis__component--clustering'],

    init() {
        this._super(...arguments);
        set(this, 'collapsed', false);
    },

    didReceiveAttrs() {
        this._super(...arguments);
        this._setSelectedFields();
    },

    _setSelectedFields() {
        const selectedFields = this.get('method.parameters.fields').join(', ');
        this.set('selectedFields', selectedFields);
    },

    actions: {
        toggleInformation() { this.toggleProperty('collapsed'); }
    }

});
