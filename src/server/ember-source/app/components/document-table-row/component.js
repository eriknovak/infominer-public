import Component from '@ember/component';

export default Component.extend({
    // component class
    classNames: ['document'],
    classNameBindings: ['selected'],
    selected: false,

    // component attributes
    dataTarget: '',

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
            docValues.push({ value: document.get(`values.${field.name}`), field: field.name });
        }
        // save values
        this.set('index', document.get('id'));
        this.set('selected', document.get('selected'));
        this.set('docValues', docValues);

        // set link with expanded info
        this.set('dataTarget', `#document-${document.id}`);
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
