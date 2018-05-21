import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { set } from '@ember/object';
import $ from 'jquery';

export default Component.extend({
    classNames: ['cluster-content'],
    columnWidth: service('column-size'),
    store:       service('store'),

    init() {
        this._super(...arguments);
        set(this, 'collapsed', false);
        set(this, 'editing-cluster-label', false);
    },

    didReceiveAttrs() {
        this._super(...arguments);
        this._setCluster();
    },

    didInsertElement() {
        this._super(...arguments);
        let self = this;
        const elementId = self.get('elementId');
        // on hover show edit button
        $(`#${elementId} .cluster-header`).hover(
          function () { $(`#${elementId} .edit-cluster-label`).addClass('show'); },
          function () { $(`#${elementId} .edit-cluster-label`).removeClass('show'); }
        );
    },

    didRender() {
        this._super(...arguments);
        let self = this;
        if (self.get('editing-cluster-label')) {
            // save cluster label change on enter
            $(`#${self.get('elementId')} input.editing`).on('keyup', function (e) {
                if (e.keyCode == 13) { self._saveClusterLabel(); }
            });
        }
    },


    actions: {
        toggleInformation() { this.toggleProperty('collapsed'); },
        editClusterLabel() { this.toggleProperty('editing-cluster-label'); },
        saveClusterLabel() { this._saveClusterLabel(); }

    },

    _setCluster() {
        let cluster = this.get('cluster');
        // prepare the layout of the components
        let aggregates = cluster.aggregates;
        // set column width for medium and large view size
        this.get('columnWidth.setColumnsWidth')(aggregates, 3, 'lg');
        this.get('columnWidth.setColumnsWidth')(aggregates, 2, 'sm');
        // get subset names
        if (cluster.subsetId) {
            set(cluster, 'clusterLabel', this.get('store').peekRecord('subset', cluster.subsetId).get('label'));
        }
        // set clusters values
        this.set('cluster', cluster);
    },

    _saveClusterLabel() {
        const elementId = this.get('elementId');
        const label = $(`#${elementId} input.editing`).val();
        let method = this.get('method');
        let cluster = this.get('cluster');
        if (cluster.subsetId) {
            let subset = this.get('store').peekRecord('subset', cluster.subsetId);
            subset.set('label', label); subset.save();
        }
        this.set('cluster.clusterLabel', label);
        // save method changes
        method.save();
        this.toggleProperty('editing-cluster-label');
    }

});
