import Service from '@ember/service';
import { set } from '@ember/object';
import { inject as service } from '@ember/service';

export default Service.extend({
    store: service('store'),

    fieldSettings: null,

    init() {
        this._super(...arguments);
        let fields = this.get('store').peekAll('dataset')
            .objectAt(0).get('fields');

        fields.forEach(field => {
            set(field, 'showInTable', field.show);
            set(field, 'showInVisual', field.show);
        });

        this.set('fieldSettings', fields);
    },

    isShownInTable(fieldId) {
        for (let field of this.get('fieldSettings')) {
            if (field.id === fieldId) { return field.showInTable; }
        }
        return false;
    },

    showFieldInTable(fieldId, isShown) {
        for (let field of this.get('fieldSettings')) {
            if (field.id === fieldId) { set(field, 'showInTable', isShown); break; }
        }
    },

    isShownInVisual(fieldName) {
        for (let field of this.get('fieldSettings')) {
            if (field.name === fieldName) { return field.showInVisual; }
        }
    },

    showFieldVisual(fieldId, isShown) {
        for (let field of this.get('fieldSettings')) {
            if (field.id === fieldId) { set(field, 'showInVisual', isShown); break; }
        }
    }



});
