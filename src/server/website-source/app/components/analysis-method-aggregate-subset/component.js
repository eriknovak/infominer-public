import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({

    // services
    columnWidth: service('column-size'),
    fieldSelection: service('field-selection'),

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    header: computed('title', function () {
        return this.get('title') ? this.get('title') : 'Data';
    }),

    aggregates: computed('fieldSelection.fields.@each.showInVisual', 'method.result', function () {
        let result = this.get('method.result');

        // prepare the layout of the components
        // TODO: remove filter
        let aggregates = result.aggregates.filter(aggregate =>
            this.get('fieldSelection').isShownInVisual(aggregate.field)
        );

        // set column width for medium and large view size
        this.get('columnWidth.setColumnsWidth')(aggregates, 3, 'lg');
        this.get('columnWidth.setColumnsWidth')(aggregates, 2, 'sm');

        return aggregates;
    }),


    actions: {

        updateStatistics() {
            this.get('method').save();
        }

    }


});
