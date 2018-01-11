import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
    // component attributes
    classNames: ['col-lg-12 clustering'],

    // services
    columnWidth: service('column-size'),

    didReceiveAttrs() {
        this._super(...arguments);
        let method = this.get('method');

        // get number of clusters
        let clusterNumber = method.get('parameters.method.k');
        let fieldInfo = method.get('parameters.features')
            .map(feature => ({ field: feature.field, type: feature.type }));

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
    }

});
