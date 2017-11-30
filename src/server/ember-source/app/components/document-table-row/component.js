import Component from '@ember/component';

export default Component.extend({
    // component class
    classNameBindings: ['selected'],
    selected: false,
    checked: false,
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
        const document = this.get('document');
        const fields = this.get('fields');

        // save document values
        let docValues = [ ];
        // get values in the fields order
        for (let field of fields) {
            // console.log(field);
            docValues.push({ value: document.get(`values.${field.name}`), field: field.name });
        }
        // save values
        this.set('index', document.get('id'));
        this.set('selected', document.get('selected'));
        this.set('docValues', docValues);
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        selectDocument() {
            // get checkbox status
            this.toggleProperty('selected');
            this.set('document.selected', this.get('selected'));

        }
    }

});
