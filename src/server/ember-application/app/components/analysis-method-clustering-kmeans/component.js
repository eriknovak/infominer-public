import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';


export default Component.extend({
    // component attributes
    classNames: ['col-lg-12', 'clustering'],

    // services
    columnWidth: service('column-size'),
    store: service('store'),


    didReceiveAttrs() {
        this._super(...arguments);

        this._setClusters();
        this._setSelectedFields();
    },

    _setClusters() {
        let clusters = this.get('method.result.clusters');
        // prepare the layout of the components
        for (let i = 0; i < clusters.length; i++) {
            let aggregates = clusters.objectAt(i).aggregates;
            // set column width for medium and large view size
            this.get('columnWidth.setColumnsWidth')(aggregates, 3, 'lg');
            this.get('columnWidth.setColumnsWidth')(aggregates, 2, 'sm');
        }
        // get subset names
        clusters.forEach(cluster => {
            if (cluster.subsetId) {
                Ember.set(cluster, 'clusterLabel', this.get('store').peekRecord('subset', cluster.subsetId).get('label'));
            } else if (cluster.clusterLabel) {
                // do nothing - cluster already has a clusterLabel
            }
        });

        this.set('clusters', clusters);
    },

    _setSelectedFields() {
        const selectedFields = this.get('method.parameters.features').map(feature => feature.field).join(', ');
        this.set('selectedFields', selectedFields);
    }


});
