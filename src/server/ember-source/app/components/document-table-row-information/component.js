import Component from '@ember/component';

export default Component.extend({
    classNames: ['document-information-row'],
    // component tag
    tagName: 'tr',

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        this.set('selected', false);
    },

    didReceiveAttrs() {
        this._super(...arguments);

        // get document valueObject and fields
        const fields = this.get('fields');
        let rowWidth = 1 + fields.length;
        this.set('rowWidth', rowWidth);

        // save document values
        const document = this.get('document');
        let docValues = [ ];
        // get values in the fields order
        for (let field of fields) {
            docValues.push({ value: document.get(`values.${field.name}`), field: field.name });
        }
        // save values
        this.set('docValues', docValues);
        this.set('collapseId', `document-${document.id}`);
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

});