import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
    // services
    columnWidth: service('column-size'),
    fieldSelection: service('field-selection'),

    header: computed('title', function () {
        return this.get('title') ? this.get('title') : 'Data';
    }),

    overview: computed('fieldSelection.fields.@each.showInVisual', function () {
        // get number of clusters
        let fieldInfo = this.get('fieldSelection.fields').filter(field => field.showInVisual)
            .map(field => ({ field: field.field, type: field.type }));

        // prepare placeholders
        let placeholders = [];
        placeholders = placeholders.concat(fieldInfo);

        // set column width for small and large view size
        this.get('columnWidth.setColumnsWidth')(placeholders, 3, 'lg');
        this.get('columnWidth.setColumnsWidth')(placeholders, 2, 'sm');
        // set placeholders
        return placeholders;
    })

});
