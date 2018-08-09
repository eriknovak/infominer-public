import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
    // component attributes
    classNames: ['document'],
    classNameBindings: ['selected'],
    selected: false,

    // component attributes
    dataTarget: '',

    // component tag
    tagName: 'tr',

    nChar: 80,

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        this.set('selected', false);
    },

    didReceiveAttrs() {
        this._super(...arguments);
        // save values
        this.set('index', this.get('document.id'));
        this.set('selected', this.get('document.selected'));

        // set link with expanded info
        this.set('dataTarget', `#document-${this.get('document.id')}`);
    },

    documentValues: computed('fields.@each.showInTable', 'query', function () {
        // get document valueObject and fields
        const fields = this.get('fields');
        // get query parameters
        const query = this.get('query');

        // save document values
        let documentValues = [ ];
        // get values in the fields order
        for (let field of fields) {
            if (!field.showInTable) { continue; }
            let value = this.get(`document.values.${field.name}`);
            if (field.type == 'string' && value) {
                value = this._trimContent(value, this.get('nChar'));
            } else if (field.type == 'string_v') {
                value = value.join(' 🡒 ');
            } else if (field.type == 'datetime') {
                value = (new Date(value)).toUTCString();
            }
            // find the selected query value, find and highligh the text
            if (query && query.text && query.text.fields.includes(field.name)) {
                const pattern = new RegExp(query.text.keywords.replace(/\s/g, '[\\s\\-\\+]'), 'gi');
                value = value.replace(pattern, str => `<span class="highlight">${str}</span>`);
            }
            documentValues.push({ value: value, field: field.name });
        }
        return documentValues;
    }),

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        /**
         * Toggles if the document is selected or not.
         */
        selectDocument() {
            // get checkbox status
            this.set('document.selected', this.get('selected'));
        }
    },

    /**
     *
     * @param {String} string - Content to be trimmed.
     * @param {Number} nChar - How many words the content can contain.
     * @returns {String} Trimmed content.
     */
    _trimContent(string, nChar) {
        let substring = string.substring(0, nChar);
        if (substring.length === string.length) { return string; }
        let lastSpace = substring.lastIndexOf(' ');
        return substring.substring(0, lastSpace) + ' ...';
    }

});
