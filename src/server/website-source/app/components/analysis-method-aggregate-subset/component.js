import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
    classNames: ['analysis-component'],
    // services
    columnWidth: service('column-size'),
    fieldSelection: service('field-selection'),

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    aggregates: computed('fieldSelection.fieldSettings.@each.showInVisual', function () {
        let result = this.get('method.result');

        // prepare the layout of the components
        // TODO: remove filter
        let aggregates = result.aggregates.filter(aggregate =>
            aggregate.type !== 'timeline' && this.get('fieldSelection').isShownInVisual(aggregate.field)
        );

        // set column width for medium and large view size
        this.get('columnWidth.setColumnsWidth')(aggregates, 3, 'lg');
        this.get('columnWidth.setColumnsWidth')(aggregates, 2, 'sm');

        return aggregates;
    })

});
