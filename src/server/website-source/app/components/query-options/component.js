import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import $ from 'jquery';

export default Component.extend({
    classNames: ['query-options'],
    columnWidth: service('column-size'),

    init() {
        this._super(...arguments);
        const query = this.get('query');
        this.set('textFields', this.get('fields').filterBy('type', 'string')
            .map(field => {
                const included = query && query.text ? query.text.fields.includes(field.name) : true;
                return { name: field.name, included };
            })
        );

        // set number fields
        let numberFields = this.get('fields').filterBy('type', 'float').map(field => {
            field.value = [field.metadata.min, field.metadata.max];
            return field;
        });

        this.get('columnWidth.setColumnsWidth')(numberFields, 2, 'md');
        this.get('columnWidth.setColumnsWidth')(numberFields, 1, 'sm');

        this.set('numberFields', numberFields);

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

        const number = this.get('numberFields')
            .map(field => ({ field: field.name, values: field.value }));
        let text = keywords.length && textFields.length ? { keywords, fields: textFields } : null;
        this.set('query', { text, number });

        this.get('action')(this.get('query'));
    }
});
