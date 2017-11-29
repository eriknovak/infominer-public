import Component from '@ember/component';

export default Component.extend({
    // component class
    classNameBindings: ['selected'],
    selected: false,
    // component tag
    tagName: 'tr',

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didReceiveAttrs() {
        this._super(...arguments);

        // get document valueObject and fields
        const valueObject = this.get('valueObject');
        const fields = this.get('fields');

        // save document values
        let docValues = [ ];
        // get values in the fields order
        for (let field of fields) {
            // console.log(field);
            docValues.push({ value: valueObject[field.name], field: field.name });
        }
        // save values
        this.set('docValues', docValues);
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        selectDocument(id) {
            // get checkbox status
            const checked = !this.$(`#checkbox-${id}`).prop('checked');
            this.set('selected', checked);
        }
    }

});
