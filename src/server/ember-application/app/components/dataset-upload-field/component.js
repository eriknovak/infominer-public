import Component from '@ember/component';
import { get, set } from '@ember/object';
import $ from 'jquery';

export default Component.extend({
    // component attributes
    tagName: 'tr',

    // possible field values
    included: true,

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        this.set('fieldTypes', [
            { type: 'string', selected: false },
            { type: 'float', selected: false }
        ]);
    },

    didReceiveAttrs() {
        this._super(...arguments);
        // get field type and possible field types
        let type = this.get('type');

        // find and set field type to the start of the array
        for (let i = 0; i < this.get('fieldTypes').length; i++) {
            let obj = this.get('fieldTypes').objectAt(i);
            if (get(obj, 'type') === type) { set(obj, 'selected', true); break; }
        }

        // set element ids
        this.set('nameId', `field-name-${this.get('index')}`);
        this.set('typeId', `field-type-${this.get('index')}`);
        this.set('checkboxId', `field-included-${this.get('index')}`);

    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        /**
         * Changes the model field value.
         */
        changeFieldName() {
            this.set('name', $(`#${this.get('nameId')}`).val().trim());
        },

        /**
         * Changes the field type value.
         */
        changeFieldType() {
            this.set('type', $(`#${this.get('typeId')}`).val());
        },

        /**
         * Changes flag for field inclusion.
         */
        changeFieldInclusion() {
            this.set('included', $(`#${this.get('checkboxId')}`).is(':checked'));
        }
    }
});
