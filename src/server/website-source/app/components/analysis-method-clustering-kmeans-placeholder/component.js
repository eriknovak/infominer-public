import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { set } from '@ember/object';

export default Component.extend({
    // component attributes
    classNames: ['analysis', 'clustering'],

    // services
    columnWidth: service('column-size'),
    fieldSelection: service('field-selection'),

    init() {
        this._super(...arguments);
        set(this, 'collapsed', false);
    },

    didReceiveAttrs() {
        this._super(...arguments);
        this._setClusters();
        this._setSelectedFields();
    },

    _setClusters() {
        let method = this.get('method');
        // get number of clusters
        let clusterNumber = method.get('parameters.method.k');
        let fieldInfo = this.get('fieldSelection.fieldSettings').filter(field => field.showInVisual)
            .map(field => ({ field: field.field, type: field.type }));

        // prepare placeholders
        let placeholders = [];
        for (let i = 0; i < clusterNumber; i++) {
            // prepare the layout of the components
            placeholders.push(fieldInfo);
            // set column width for small and large view size
            this.get('columnWidth.setColumnsWidth')(placeholders[i], 3, 'lg');
            this.get('columnWidth.setColumnsWidth')(placeholders[i], 2, 'sm');
        }
        // set placeholders
        this.set('clusters', placeholders);
    },

    _setSelectedFields() {
        const selectedFields = this.get('method.parameters.fields').join(', ');
        this.set('selectedFields', selectedFields);
    },

    actions: {
        toggleInformation() { this.toggleProperty('collapsed'); }
    }

});
