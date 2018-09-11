import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import $ from 'jquery';

export default Route.extend({

    fieldSelection: service('field-selection'),

    // default parameters
    defaultPage: 1,
    defaultLimit: 10,
    defaultSortTarget: null,
    defaultQuery: true,

    // current parameters
    page: 1,
    limit: 10,
    sortTarget: null,
    query: null,

    // aggregates
    aggregates: null,

    init() {
        this._super(...arguments);
        this.set('defaultQuery', { calculateAggregates: true });
        this.set('query', this.get('defaultQuery'));

    },

    beforeModel(transition) {
        // modify namespace for subset model
        let { dataset_id } = transition.params.dataset;
        let { subset_id } = transition.params['dataset.subset'];
        // construct namespace
        const namespace = `api/datasets/${dataset_id}/subsets/${subset_id}`;
        let documentAdapter = this.get('store').adapterFor('document');

        // check if in same namespace - accordingly change page and limit
        if (documentAdapter.get('namespace') !== namespace) {
            // set default parameters
            this.set('page', this.defaultPage);
            this.set('limit', this.defaultlimit);
            this.set('sortTarget', this.defaultSortTarget);
            this.set('query', this.defaultQuery);
            // set all documents as un-selected
            this.get('store').peekAll('document')
                .forEach(doc => doc.set('selected', false));

            // set adapter for documents
            documentAdapter.set('namespace', namespace);
        }
    },

    model() {
        let query = { };
        if (this.get('page')) { query.page = this.get('page'); }
        if (this.get('limit')) { query.limit = this.get('limit'); }
        if (this.get('sortTarget')) { query.sort = this.get('sortTarget'); }
        if (this.get('query')) { query.query = this.get('query'); }

        // service for field selection
        let fieldSelection = this.get('fieldSelection');

        // get documents
        return this.get('store').query('document', query)
            .then(documents => {
                if (documents.meta.aggregates.length) {
                    this.set('aggregates', documents.meta.aggregates);
                }
                documents.meta.fields.forEach(field => {
                    field.showInTable = fieldSelection.isShownInTable(field.id);
                });

                return {
                    documents,
                    metadata: documents.meta,
                    method: { result: { aggregates: this.get('aggregates') } },
                    parameters: {
                        label: this.get('query.text.keywords'),
                        query: this.get('query')
                    }
                };
            });
    },

    actions: {
        /**
         * Change the number of documents to be displayed in the table and
         * make a new request.
         * @param {Number} limit - The number of documents to be displayed.
         */
        changeLimit(limit) {
            // update the limit and transition to route
            this.set('limit', limit);
            // check if the pagination changes
            const pagination = this.get('controller.model.metadata.pagination');
            // calculage the new maxpage value
            let maxPage = pagination.documentCount / limit;
            if (maxPage % 1 !== 0) { maxPage = Math.floor(maxPage) + 1; }
            // change page value if not in bound
            if (pagination.page > maxPage) { this.set('page', maxPage); }
            this.set('query.calculateAggregates', false);
            // update model
            this._updateModel();

        },

        /**
         * Change the document page in the table and make a new request.
         * @param {Number} page - The page number of documents.
         */
        changePage(page) {
            // update the limit and transition to route
            this.set('page', page);
            this.set('query.calculateAggregates', false);
            // update model
            this._updateModel();
        },

        /**
         * Sort the documents by the field.
         * @param {Object} params - The sort parameters.
         * @param {String} param.field - The field name.
         * @param {String} param.sortType - The sort type.
         */
        sortByField(params) {
            this.set('sortTarget', params);
            this.set('query.calculateAggregates', false);
            // update model
            this._updateModel();
        },

        /**
         * Creates the subset out of the selected documents.
         * @param {Object} params - The subset information.
         * @param {String} param.label - The subset label.
         * @param {String} param.description - The subset description.
         * @param {Object} param.parameters - The parameters for creating the subset.
         * @param {Object} param.parameters.query - The query parameters.
         */
        saveResults(params) {
            let self = this;

            // get parent subset - to save method
            let parentSubset = self.modelFor('dataset.subset');

            // create a new method
            const method = self.get('store').createRecord('method', {
                id: self.modelFor('dataset').get('numberOfMethods'),
                methodType: 'filter.manual',
                parameters: { query: params.parameters.query },
                appliedOn: parentSubset
            });
            self.modelFor('dataset').get('hasMethods').pushObject(method);
            self.modelFor('dataset').incrementProperty('numberOfMethods');

            // create new subset
            const subset = self.get('store').createRecord('subset', {
                id: self.modelFor('dataset').get('numberOfSubsets'),
                label: params.label,
                description: params.description,
                resultedIn: method
            });
            self.modelFor('dataset').get('hasSubsets').pushObject(subset);
            self.modelFor('dataset').incrementProperty('numberOfMethods');
            self.modelFor('dataset').incrementProperty('numberOfSubsets');

            // save method
            method.save().then(function () {
                subset.save().then(function () {
                    // hide modal and transition to new route
                    $('#subset-create-modal').modal('toggle');
                    $(`#subset-create-modal .modal-footer .btn-primary`).html('Save');
                    self.transitionTo('dataset.subset', self.modelFor('dataset'), subset.id);
                }).catch(error => {
                    console.log(error.message);
                });
            });

        },

        changeQuery(params) {
            // check what are the parameters
            const query = { };
            if (params.text) { query.text = params.text; }
            if (params.number.length) { query.number = params.number; }
            query.calculateAggregates = true;
            //set the query parameters
            this.set('query', query);
            // we don't know how many results there will be
            // set to first page and remove sorting
            this.set('page', 1);
            this.set('sortTarget', null);
            // update model
            this._updateModel();
        }

    },

    // helper functions
    _updateModel() {
        // request for data and update the model
        this.model().then(model => this.set('controller.model', model));
    }


});
