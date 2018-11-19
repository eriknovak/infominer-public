import Service from '@ember/service';
import { observer, get, set } from '@ember/object';
import { inject as service } from '@ember/service';

export default Service.extend({
    store: service('store'),

    dataset: null,
    fields: null,

    init() {
        this._super(...arguments);
        let dataset = this.get('store').peekAll('dataset')
            .objectAt(0);

        let fields = dataset.get('fields');
        fields.forEach(field => {
            set(field, 'showInTable', field.show);
            set(field, 'showInVisual', field.show);
        });

        this.set('dataset', dataset);
        this.set('fields', fields);
    },

    fieldObserver: observer('fields.@each.showInVisual', function () {
        let selectedFields = this.get('fields').filter(field => get(field, 'showInVisual'))
            .map(field => field.name);

        this.set('dataset.selectedFields', selectedFields);
        this.get('dataset').save();
    }),

    isShownInTable(fieldId) {
        for (let field of this.get('fields')) {
            if (field.id === fieldId) { return field.showInTable; }
        }
        return false;
    },

    showFieldInTable(fieldId, isShown) {
        for (let field of this.get('fields')) {
            if (field.id === fieldId) {
                set(field, 'showInTable', isShown); break; }
        }
    },

    isShownInVisual(fieldName) {
        for (let field of this.get('fields')) {
            if (field.name === fieldName) { return field.showInVisual; }
        }
    },

    showFieldVisual(fieldId, isShown) {
        for (let field of this.get('fields')) {
            if (field.id === fieldId) { set(field, 'showInVisual', isShown); break; }
        }


    }

});
