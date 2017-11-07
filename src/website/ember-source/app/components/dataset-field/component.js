import Component from '@ember/component';

export default Component.extend({
    tagName: 'tr',

    // possible field values
    fieldTypes: ['string', 'int', 'float'],

    didReceiveAttrs() {
        this._super(...arguments);
        // get field type
        let type = this.get('type');
        // get possible types
        let fieldTypes = this.get('fieldTypes');
        // find and set field type to the start of the array
        let index = fieldTypes.indexOf(type);
        if (index > -1) {
            fieldTypes.splice(index, 1);
            fieldTypes.unshift(type);
        }
        // set field types
        this.set('fieldTypes', fieldTypes);
    }
});
