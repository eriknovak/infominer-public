import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
    classNames: ['analysis-component'],
    // services
    columnWidth: service('column-size'),

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didReceiveAttrs() {
        this._super(...arguments);
        let result = this.get('method.result');

        // prepare the layout of the components
        // TODO: remove filter
        let aggregates = result.aggregates.filter(aggregate => aggregate.type !== 'timeline');
        // set column width for medium and large view size
        this.get('columnWidth.setColumnsWidth')(aggregates, 3, 'lg');
        this.get('columnWidth.setColumnsWidth')(aggregates, 2, 'sm');

        // set aggregates with classes
        this.set('aggregates', aggregates);
    }
});
