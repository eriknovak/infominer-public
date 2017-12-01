import Component from '@ember/component';

export default Component.extend({
    tagName: 'tr',

    // possible field values
    fieldTypes: ['string', 'int', 'float'],

    included: true,

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

        // set element ids
        this.set('nameId', `field-name-${this.get('index')}`);
        this.set('typeId', `field-type-${this.get('index')}`);
        this.set('checkboxId', `field-included-${this.get('index')}`);

    },


    actions: {
        /**
         * Changes the model field value.
         */
        changeFieldName() {
            this.set('name', Ember.$(`#${this.get('nameId')}`).val());
        },

        /**
         * Changes the field type value.
         */
        changeFieldType() {
            this.set('type', Ember.$(`#${this.get('typeId')}`).val());
        },

        /**
         * Changes flag for field inclusion.
         */
        changeFieldInclusion() {
            this.set('included', Ember.$(`#${this.get('checkboxId')}`).is(':checked'));
        }
    }
});
