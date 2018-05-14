import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
    classNames: ['query-options'],

    init() {
        this._super(...arguments);
        const query = this.get('query');
        this.set('textFields', this.get('fields').filterBy('type', 'string')
            .map(field => {
                const included = query && query.text ? query.text.fields.includes(field.name) : true;
                return { name: field.name, included };
            })
        );
        this.set('numberFields', this.get('fields').filterBy('type', 'float'));
        const keywords = query && query.text ? query.text.keywords : null;
        this.set('keywords', keywords);
    },

    didInsertElement() {
        let self = this;
        self._super(...arguments);
        // allow showing the dropdown menu after clicking on it's element
        $(`#${self.get('elementId')} .dropdown-menu`).click(function(e) {
            e.stopPropagation();
        });
        // on enter execute query
        $(`#${self.get('elementId')} input.keywords-input`).on('keyup', function (e) {
            if (e.keyCode == 13) { self.changeQuery(); }
        });
    },

    numberOfSelectedFields: computed('textFields.@each.included', function () {
        return this.get('textFields').map(field => field.included ? 1 : 0)
                    .reduce((total, current) => total + current, 0);
    }),

    actions: {
        changeQuery() { this.changeQuery(); }   
    },

    changeQuery() {
        // get keywords and selected fields
        const keywords = $(`#${this.get('elementId')} input[data-purpose="keywords"]`).val();
        const textFields = this.get('textFields').filterBy('included', true).map(field => field.name);
        let text = keywords.length && textFields.length ? { keywords, fields: textFields } : null;
        this.set('query', { text });

        this.get('action')(this.get('query'));
    }
});
