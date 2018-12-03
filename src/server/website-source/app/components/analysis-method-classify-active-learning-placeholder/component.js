import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { set } from '@ember/object';

export default Component.extend({
    // component attributes
    classNames: ['analysis__component', 'analysis__component--clustering'],

    // services
    columnWidth: service('column-size'),
    fieldSelection: service('field-selection'),

    init() {
        this._super(...arguments);
        set(this, 'collapsed', false);
    },

    didReceiveAttrs() {
        this._super(...arguments);
        this._setClasses();
        this._setSelectedFields();
    },

    _setClasses() {
        // get number of clusters
        let fieldInfo = this.get('fieldSelection.fields').filter(field => field.showInVisual)
            .map(field => ({ field: field.field, type: field.type }));

        // prepare placeholders
        let placeholders = [];
        for (let i = 0; i < 2; i++) {
            // prepare the layout of the components
            placeholders.push(fieldInfo);
            // set column width for small and large view size
            this.get('columnWidth.setColumnsWidth')(placeholders[i], 3, 'lg');
            this.get('columnWidth.setColumnsWidth')(placeholders[i], 2, 'sm');
        }
        // set placeholders
        this.set('classes', placeholders);
    },

    _setSelectedFields() {
        const selectedFields = this.get('method.parameters.fields').join(', ');
        this.set('selectedFields', selectedFields);
    },

    actions: {
        toggleInformation() { this.toggleProperty('collapsed'); }
    }

});
