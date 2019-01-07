import Component from '@ember/component';
import { set } from '@ember/object';


export default Component.extend({
    // component attributes
    classNames: ['analysis__component', 'analysis__component--active-learning'],

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
        const empty = stopwords.length === 1 && stopwords[0] === '';
        this.set('stopwords', !empty ? stopwords.join(', ') : '(not provided)');
    },

    actions: {
        toggleInformation() { this.toggleProperty('collapsed'); }
    }

});
