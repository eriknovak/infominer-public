import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
    // component attributes
    classNames: ['col-lg-12'],

    // services
    columnWidth: service('column-size'),

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didReceiveAttrs() {
        this._super(...arguments);
        let result = this.get('result');

        // prepare the layout of the components
        let aggregates = result.aggregates;
        // set column width for medium and large view size
        this.get('columnWidth.setColumnsWidth')(aggregates, 3, 'lg');
        this.get('columnWidth.setColumnsWidth')(aggregates, 2, 'md');

        // set aggregates with classes
        this.set('aggregates', aggregates);
    }
});
