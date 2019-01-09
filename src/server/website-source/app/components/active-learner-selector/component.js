import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({

    fieldSelection: service('field-selection'),
    store:          service('store'),

    // prepare document fields
    documentFields: computed('currentDoc', function () {
        // save document values
        let documentValues = this.get('currentDoc.document.values');
        let fields = this.get('fieldSelection.fields');
        let values = [ ];

        // get values in the fields order
        for (let field of fields) {
            let value = documentValues[field.name];
            if (value) {

                // prepare document attribute based on its field type
                switch (field.type) {
                    case 'string_v':
                        value = value.join(' 🡒 ');
                        break;
                    case 'datetime':
                        value = (new Date(value)).toUTCString();
                        break;
                    default:
                        break;
                }

            }
            // store the change in the array
            values.push({ value, name: field.name });
        }
        // save the modified values
        return values;
    }),

    actions: {
        /**
         * @description Assigns the label to the document and updates the
         * active learning model.
         * @param {Number} label - The label assigned to the document; 1 for positive
         * and -1 for negative label.
         */
        saveLabel(label) {
            this.set('currentDoc.label', label);
            this.get('updateActiveLearning')();
        }
    },

});
