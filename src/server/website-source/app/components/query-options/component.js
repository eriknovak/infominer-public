import Component from '@ember/component';

export default Component.extend({
    classNames: ['query-options'],

    init() {
        this._super(...arguments);
        this.set('textFields', this.get('fields').filterBy('type', 'string')
            .map(field => ({ name: field.name, included: true }))
        );
        this.set('numberFields', this.get('fields').filterBy('type', 'float'));
        // set the query parameter
        this.set('query', { text: null });
    },

    didReceiveAttrs() {
        this._super(...arguments);

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
            this.set('query.text', text);

            console.log(this.get('query'));
            this.get('action')(this.get('query'));
        }
    }
});
