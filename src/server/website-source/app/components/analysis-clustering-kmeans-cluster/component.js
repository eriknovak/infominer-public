import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, set } from '@ember/object';
import $ from 'jquery';

export default Component.extend({
    classNames: ['analysis-component', 'cluster-content'],
    columnWidth: service('column-size'),
    store:       service('store'),

    init() {
        this._super(...arguments);
        set(this, 'collapsed', false);
        set(this, 'editing-label', false);
    },

    didReceiveAttrs() {
        this._super(...arguments);
        this._setCluster();
        this.set('page', 1);
        this.set('limit', 5);
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
        if (self.get('editing-label')) {
            // save cluster label change on enter
            $(`#${self.get('elementId')} input.editing`).on('keyup', function (e) {
                if (e.keyCode == 13) { self._saveLabel(); }
            });
        }
    },


    documents: computed('cluster.documentSample', 'limit', 'page', function () {
        let limit = this.get('limit');
        let page = this.get('page');
        return this.get('cluster.documentSample') ?
            this.get('cluster.documentSample').slice(limit*(page - 1), limit*page) :
            null;
    }),

    metadata: computed('cluster.documentSample', 'limit', 'page', function () {
        return {
            fields: this.get('dataset.fields'),
            query: null,
            pagination: {
                page: this.get('page'),
                limit: this.get('limit'),
                documentCount: this.get('cluster.documentSample.length')
            }
        };
    }),

    actions: {
        toggleInformation() { this.toggleProperty('collapsed'); },
        editLabel() { this.toggleProperty('editing-label'); },
        saveLabel() { this._saveLabel(); },

        updateSubsetCreationParams() {
            this.set('subsetCreationParams', {
                label: this.get('cluster.label'),
                type: 'Clustering',
                methodId: this.get('method.id'),
                clusterId: this.get('index'),
                documentCount: this.get('cluster.documentCount')
            });
        },

        changeLimit(limit) {
            this.set('limit', limit);
        },
        changePage(page) {
            this.set('page', page);
        },
        sortByField(fieldParams) {
            console.log(fieldParams);
            console.log(this.get('dataset.fields'));
            console.log(this.get('cluster.documentSample'));

         }
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
            set(cluster, 'label', this.get('store').peekRecord('subset', cluster.subsetId).get('label'));
        }
        // set clusters values
        this.set('cluster', cluster);
    },

    _saveLabel() {
        const elementId = this.get('elementId');
        const label = $(`#${elementId} input.editing`).val();
        let method = this.get('method');
        let cluster = this.get('cluster');
        if (cluster.subsetId) {
            let subset = this.get('store').peekRecord('subset', cluster.subsetId);
            subset.set('label', label); subset.save();
        }
        this.set('cluster.label', label);
        // save method changes
        method.save();
        this.toggleProperty('editing-label');
    }

});
