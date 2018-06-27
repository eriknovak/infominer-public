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
        let numberOfColumns = /*1 +*/ fields.length;
        this.set('numberOfColumns', numberOfColumns);

        // get query parameters
        const query = this.get('query');

        // save document values
        let documentValues = [ ];
        // get values in the fields order
        for (let field of fields) {
            let value = this.get(`document.values.${field.name}`);
            // find the selected query value, find and highligh the text
            if (field.type == 'string_v') { 
                value = value.join(' 🡒 '); 
            } else if (field.type == 'datetime') { 
                value = (new Date(value)).toUTCString(); 
            }
            if (query && query.text && query.text.fields.includes(field.name)) {
                const pattern = new RegExp(query.text.keywords.replace(/\s/g, '[\\s\\-\\+]'), 'gi');
                value = value.replace(pattern, str => `<span class="highlight">${str}</span>`);
            }
            documentValues.push({ value, field: field.name });
        }
        // save values
        this.set('documentValues', documentValues);
        this.set('collapseId', `document-${this.get('document.id')}`);
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

});