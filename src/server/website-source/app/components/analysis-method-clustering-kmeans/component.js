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
        this._setStopwords();
    },

    _setSelectedFields() {
        const selectedFields = this.get('method.parameters.fields').join(', ');
        this.set('selectedFields', selectedFields);
    },

    _setStopwords() {
        const stopwords = this.get('method.parameters.stopwords');
        this.set('stopwords', stopwords ? stopwords.join(', ') : 'None');
    },

    actions: {
        toggleInformation() { this.toggleProperty('collapsed'); }
    }

});
