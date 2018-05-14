import Component from '@ember/component';
import { computed, get, set } from '@ember/object';
import $ from 'jquery';

export default Component.extend({
    // component attributes
    classNameBindings: ['included::disabled'],
    tagName: 'tr',

    // possible field values
    included: true,

    disabled: computed('included', function () {
        return !this.get('included');
    }),

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        this.set('fieldTypes', [
            { type: 'string', selected: false },
            { type: 'float', selected: false }
        ]);
        // get field type and possible field types
        let type = this.get('type');

        // find and set field type to the start of the array
        for (let i = 0; i < this.get('fieldTypes').length; i++) {
            let obj = this.get('fieldTypes').objectAt(i);
            if (get(obj, 'type') === type) { 
                set(obj, 'selected', true); 
                // modify fieldTypes to reflect the possible type options
                this.set('fieldTypes', this.get('fieldTypes').slice(0, i+1));
                break; 
            }
        }
    },

    didReceiveAttrs() {
        this._super(...arguments);
        // set element ids
        this.set('nameId', `field-name-${this.get('index')}`);
        this.set('typeId', `field-type-${this.get('index')}`);
        this.set('checkboxId', `field-included-${this.get('index')}`);
    },

    didInsertElement() {
        this._super(...arguments);
        this.validateFieldName();
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
            // validate field name if included in dataset
            if (this.get('included')) { this.validateFieldName(); }
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
            if (this.get('included')) {
                // validate field name if field is included
                this.validateFieldName();
            } else {
                // ignore field validation - field will not be present
                this.set('invalidCharacters', '');
                this.set('invalid', false);
            }
        }
    },

    validateFieldName() {
        // check if field name exists
        this.set('nameNotExists', this.get('name').length === 0);

        // check if the field name is already in use
        const numberOfSameName = this.get('fieldList').filterBy('included', true)
            .map(field => field.name === this.get('name') ? 1 : 0)
            .reduce((total, number) => total + number, 0);
        this.set('multipleNames', numberOfSameName !== 1);

        // check if there are invalid characters in field
        const notAllowed = /[^a-zA-Z\_]/g;
        this.set('invalidCharacters', this.get('name').match(notAllowed));
        this.set('invalid', this.get('invalidCharacters') || this.get('multipleNames') || this.get('nameNotExists'));
    }

});
