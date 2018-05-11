import Component from '@ember/component';

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
        this._super(...arguments);
        $(`#${this.get('elementId')} .dropdown-menu`).click(function(e) {
            e.stopPropagation();
        });
    },


    actions: {
        changeQuery() {
            // get keywords and selected fields
            const keywords = $(`#${this.get('elementId')} input[data-purpose="keywords"]`).val();
            const textFields = this.get('textFields').filterBy('included', true).map(field => field.name);
            let text = keywords.length && textFields.length ? { keywords, fields: textFields } : null;
            this.set('query', { text });

            this.get('action')(this.get('query'));
        }
    }
});
