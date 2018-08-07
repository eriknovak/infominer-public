import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, get, set } from '@ember/object';
import $ from 'jquery';

export default Component.extend({
    classNames: ['analysis-component', 'cluster-content'],
    fieldSelection: service('field-selection'),
    columnWidth: service('column-size'),
    store:       service('store'),

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        set(this, 'collapsed', false);
        set(this, 'editing-label', false);
        set(this, 'page', 1);
        set(this, 'limit', 5);
    },

    didReceiveAttrs() {
        this._super(...arguments);
        let cluster = this.get('cluster');
        if (cluster.subset.id) {
            set(cluster, 'label', this.get('store').peekRecord('subset', cluster.subset.id).get('label'));
        }
    },

    didInsertElement() {
        let self = this;
        self._super(...arguments);
        const elementId = self.get('elementId');
        // on hover show edit button
        $(`#${elementId} .cluster-header`).hover(
          function () { $(`#${elementId} .edit-cluster-label`).addClass('show'); },
          function () { $(`#${elementId} .edit-cluster-label`).removeClass('show'); }
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

    aggregates: computed('fieldSelection.fields.@each.showInVisual', function () {
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
            this.get('dataset.fields').forEach(function (field) {
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
        let method = this.get('method');
        let cluster = this.get('cluster');
        if (cluster.subset.id) {
            let subset = this.get('store').peekRecord('subset', cluster.subset.id);
            subset.set('label', label); subset.save();
        }
        this.set('cluster.label', label);
        // save method changes
        method.save();
        this.toggleProperty('editing-label');
    }

});
