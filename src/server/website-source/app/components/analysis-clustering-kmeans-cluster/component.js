import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, get, set } from '@ember/object';
import $ from 'jquery';

export default Component.extend({
    classNames: ['overview'],

    fieldSelection: service('field-selection'),
    columnWidth: service('column-size'),
    store:       service('store'),

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        set(this, 'editing-label', false);
        set(this, 'collapsed', false);
        set(this, 'page', 1);
        set(this, 'limit', 5);
    },

    didReceiveAttrs() {
        this._super(...arguments);
        let cluster = this.get('cluster');

        const dataset = this.get('dataset');
        const clusterSubset = this.get('store').peekRecord('subset', cluster.subset.id);

        this.set('label', clusterSubset.get('label'));

        const clusterCount = clusterSubset.get('documentCount');
        const allCount = dataset.get('numberOfDocuments');

        const percentageCoverage = (clusterCount / allCount * 100).toFixed(1);

        this.set('numberOfDocuments', `${clusterCount} (${percentageCoverage}%)`);

        if (cluster.avgSimilarity) {
            set(cluster, 'avgSimProcent', (cluster.avgSimilarity * 100).toFixed(1));
        }
    },

    didInsertElement() {
        let self = this;
        self._super(...arguments);
        const elementId = self.get('elementId');
        // on hover show edit button
        $(`#${elementId} .overview__title`).hover(
          function () { $(`#${elementId} .overview__title--edit`).addClass('show'); },
          function () { $(`#${elementId} .overview__title--edit`).removeClass('show'); }
        );
    },

    didRender() {
        let self = this;
        self._super(...arguments);
        if (self.get('editing-label')) {
            // save cluster label change on enter
            $(`#${self.get('elementId')} input.editing`).on('keyup', function (e) {
                if (e.keyCode == 13) { self._saveLabel(); }
            });
        }
    },

    aggregates: computed('fieldSelection.fields.@each.showInVisual', 'cluster.aggregates', function () {
        // set column width for medium and large view size
        // TODO: remove filter
        let aggregates = this.get('cluster.aggregates').filter(aggregate =>
            this.get('fieldSelection').isShownInVisual(aggregate.field)
        );
        this.get('columnWidth.setColumnsWidth')(aggregates, 3, 'lg');
        this.get('columnWidth.setColumnsWidth')(aggregates, 2, 'sm');
        // get subset names
        return aggregates;
    }),

    documents: computed('cluster.documentSample', 'limit', 'page', function () {
        let limit = this.get('limit');
        let page = this.get('page');
        return this.get('cluster.documentSample') ?
            this.get('cluster.documentSample').slice(limit*(page - 1), limit*page) :
            null;
    }),

    metadata: computed('cluster.documentSample', 'limit', 'page', function () {
        return {
            fields: this.get('fieldSelection.fields'),
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

        changeLimit(limit) {
            this.set('limit', limit);
        },
        changePage(page) {
            this.set('page', page);
        },

        sortByField(fieldParams) {
            this.get('fieldSelection.fields').forEach(function (field) {
                set(field, 'sortType', null);
                if (get(field, 'name') === fieldParams.field) {
                    set(field, 'sortType', fieldParams.sortType);
                }
            });

            let documents = this.get('cluster.documentSample').sortBy(`values.${fieldParams.field}`);
            if (fieldParams.sortType === 'desc') {
                documents.reverse();
            }
            this.set('cluster.documentSample', documents);
         }
    },

    _saveLabel() {
        const elementId = this.get('elementId');
        const label = $(`#${elementId} input.editing`).val();

        // save the label of the subset
        let subset = this.get('store').peekRecord('subset', this.get('cluster').subset.id);
        subset.set('label', label); subset.save();

        // save the label of the cluster
        this.set('label', subset.get('label'));
        this.toggleProperty('editing-label');
    }

});
