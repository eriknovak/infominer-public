import Component from '@ember/component';

export default Component.extend({
    // component attributes
    classNames: ['document-information-row'],
    tagName: 'tr',

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didReceiveAttrs() {
        this._super(...arguments);

        // get document valueObject and fields
        const fields = this.get('fields');
        let numberOfColumns = 1 + fields.length;
        this.set('numberOfColumns', numberOfColumns);

        // save document values
        const document = this.get('document');
        let documentValues = [ ];
        // get values in the fields order
        for (let field of fields) {
            documentValues.push({ value: document.get(`values.${field.name}`), field: field.name });
        }
        // save values
        this.set('documentValues', documentValues);
        this.set('collapseId', `document-${document.id}`);
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

});