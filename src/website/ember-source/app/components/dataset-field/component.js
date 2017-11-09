import Component from '@ember/component';

export default Component.extend({
    tagName: 'tr',

    // possible field values
    fieldTypes: ['string', 'int', 'float'],

    didReceiveAttrs() {
        this._super(...arguments);
        // get field type and possible field types
        let type = this.get('type');
        let fieldTypes = this.get('fieldTypes');
        // find and set field type to the start of the array
        let index = fieldTypes.indexOf(type);
        if (index > -1) {
            fieldTypes.splice(index, 1);
            fieldTypes.unshift(type);
        }
        // set field types
        this.set('fieldTypes', fieldTypes);
    },


    actions: {
        /**
         * Changes the model field value.
         */
        changeFieldName() {
            this.set("name", Ember.$(`#field-name-${this.get('index')}`).val());
        },

        /**
         * Changes the field type value.
         */
        changeFieldType() {
            this.set("type", Ember.$(`#field-type-${this.get('index')}`).val());
        },

        /**
         * Changes flag for field inclusion.
         */
        changeFieldInclusion() {
            this.set("included", Ember.$(`#field-included-${this.get('index')}`).is(':checked'));
        }
    }
});
