import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';


export default Component.extend({
    // component attributes
    classNames: ['col-lg-12 clustering'],

    // services
    columnWidth: service('column-size'),

    clusters: computed('method.result.clusters', function () {
        let clusters = this.get('method.result.clusters');
        // prepare the layout of the components
        for (let i = 0; i < clusters.length; i++) {
            let aggregates = clusters.objectAt(i).aggregates;
            // set column width for medium and large view size
            this.get('columnWidth.setColumnsWidth')(aggregates, 3, 'lg');
            this.get('columnWidth.setColumnsWidth')(aggregates, 2, 'sm');
        }
        return clusters;
    })

});
