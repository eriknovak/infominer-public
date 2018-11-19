import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, get, set } from '@ember/object';

export default Component.extend({

    fieldSelection: service('field-selection'),
    store:          service('store'),

    documentFields: computed('currentDoc', function () {
        // save document values
        let documentValues = this.get('currentDoc.document.values');
        let fields = this.get('fieldSelection.fields');
        let values = [ ];
        // get values in the fields order
        for (let field of fields) {
            let value = documentValues[field.name];
            if (value) {
                // find the selected query value, find and highligh the text
                if (field.type == 'string_v') {
                    value = value.join(' 🡒 ');
                } else if (field.type == 'datetime') {
                    value = (new Date(value)).toUTCString();
                }
            }
            values.push({ value, name: field.name });
        }
        return values;
    }),

    actions: {
         saveLabel(label) {
            this.set('currentDoc.label', label);
            this.get('updateActiveLearning')();
        }
    },

});
