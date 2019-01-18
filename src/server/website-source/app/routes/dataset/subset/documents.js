import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { set } from '@ember/object';
import $ from 'jquery';

export default Route.extend({

    fieldSelection: service('field-selection'),
    notify: service('notify'),

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
                    subset: this.modelFor('dataset.subset'),
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
                // id: self.modelFor('dataset').get('numberOfMethods') + 1,
                methodType: 'filter.manual',
                parameters: { query: params.parameters.query },
                appliedOn: parentSubset
            });
            self.modelFor('dataset').get('hasMethods').pushObject(method);

            // create new subset
            const subset = self.get('store').createRecord('subset', {
                // id: self.modelFor('dataset').get('numberOfSubsets') + 1,
                label: params.label,
                description: params.description,
                resultedIn: method
            });
            self.modelFor('dataset').get('hasSubsets').pushObject(subset);

            // save method
            return method.save().then(() => {
                subset.save().then(_subset => {
                    // save methods created at subset creation
                    _subset.get('usedBy').then(_methods => {
                        _methods.forEach(_method => {
                            self.modelFor('dataset').get('hasMethods').pushObject(_method);
                        });
                    });
                    // transition to new route
                    self.transitionTo('dataset.subset', self.modelFor('dataset'), subset.id);
                }).catch(error => {

                    // notify user about the status
                    this.get('notify').info({
                        html: `<div class="notification">
                                Infominer was unable to save subset
                                <span class="label">
                                    ${params.label}
                                </span>. Please try again.
                            </div>`
                    });
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
        },

        /**
         * @description Moves the selected documents to the target subset.
         * @param {Number} subsetId - The target subset from where we would like
         * to move the document.
         */
        moveDocuments(subsetId) {

            // get documents that would be moved
            const documents = this.get('store').peekAll('document').filterBy('selected');

            // check if at least one document is selected
            if (!documents.length) {
                // notify the user about the error of his actions
                return this.get('notify').alert({
                    html: `<div class="notification">
                            No documents selected.
                        </div>`
                });
            }

            // get current and target subsets
            let currentSubset = this.modelFor('dataset.subset');
            let targetSubset = this.get('store').peekRecord('subset', subsetId);

            // promise container
            let promises = [];

            documents.forEach(document => {
                // remove subset from the document subsets array
                document.get('subsets').removeObject(currentSubset);
                document.get('subsets').addObject(targetSubset);
                // appropriately increment/decrement documentCount
                currentSubset.decrementProperty('documentCount');
                targetSubset.incrementProperty('documentCount');
                // remove the selected flag from the document
                document.set('selected', false);
                // save the modified document
                promises.push(document.save());
            });

            // update the subset modified state
            currentSubset.set('modified', true);
            targetSubset.set('modified', true);

            currentSubset.get('usedBy').get('firstObject').set('outOfDate', true);
            targetSubset.get('usedBy').get('firstObject').set('outOfDate', true);

            // get document unique identifiers
            const documentIds = documents.map(doc => doc.get('id')).join(',');

            // wait for all of the documents to be updated
            Promise.all(promises).then(() => {

                // notify the user that documents were deleted
                let message = this.get('notify').info({
                    html: `<div class="notification">
                            ${documents.length} documents moved.
                            <a class="label label-undo"
                              data-document-ids="${documentIds}"
                              data-target-subset=${subsetId}>
                                UNDO
                            </a>
                           </div>`
                }, { closeAfter: 20000 });

                $('.ember-notify-default').on('click', 'a.label-undo', function () {
                    // get the modified documents and target subset
                    const documentIds  = $(this).data('documentIds').split(',');
                    const targetSubset = $(this).data('targetSubset');
                    // hide the notification message
                    message.set('visible', false);
                    // undo the document movement
                    self._undoMoveDocuments(documentIds, targetSubset);
                });

                // once updated update the model
                this._updateModel();
            });
        },


        /**
         * @description Delete the selected documents from the subset.
         */
        deleteDocuments() {
            let self = this;
            // get documents that would be deleted
            const documents = this.get('store').peekAll('document').filterBy('selected');

            // check if some documetns were selected
            if (!documents.length) {
                // notify the user about the error of his actions
                return this.get('notify').alert({
                    html: `<div class="notification">
                            No documents selected.
                        </div>`
                });
            }

            // get current subset
            let subset = this.modelFor('dataset.subset');

            // promise container
            let promises = [];

            // delete records from the subset
            documents.forEach(document => {
                // remove subset from the document subsets array
                document.get('subsets').removeObject(subset);
                subset.decrementProperty('documentCount');
                document.set('selected', false);
                // save the modified document
                promises.push(document.save());
            });

            // update the subset modified state
            subset.set('modified', true);
            subset.get('usedBy').get('firstObject').set('outOfDate', true);

            // get document unique identifiers
            const documentIds = documents.map(doc => doc.get('id')).join(',');

            // wait for all of the documents to be updated
            Promise.all(promises).then(() => {

                // notify the user that documents were deleted
                let message = this.get('notify').info({
                    html: `<div class="notification">
                            ${documents.length} documents deleted.
                            <a class="label label-undo" data-document-ids="${documentIds}">
                              UNDO
                            </a>
                           </div>`
                }, { closeAfter: 20000 });

                $('.ember-notify-default').on('click', 'a.label-undo', function () {
                    // get the modified documents
                    const documentIds  = $(this).data('documentIds').split(',');
                    // remove the notify message
                    message.set('visible', false);
                    // undo the delete documents action
                    self._undoDeleteDocuments(documentIds);
                });

                // once updated update the model
                this._updateModel();
            });
        },

    },


    /**
     * @description Undo the document deletion action.
     * @param {String[]} documentIds - Deleted document ids.
     */
    _undoDeleteDocuments(documentIds) {

        // get documents from the provided ids
        let documents = documentIds.map(id => this.get('store').peekRecord('document', id));

        // get current subset
        let subset = this.modelFor('dataset.subset');

        // promise container
        let promises = [];
        // undo changes of the documents
        documents.forEach(document => {
            // remove subset from the document subsets array
            document.get('subsets').addObject(subset);
            subset.incrementProperty('documentCount');
            // save the modified document
            promises.push(document.save());
        });

        // wait for all of the documents to be updated
        Promise.all(promises).then(() => {
            // once updated update the model
            this._updateModel();
        });

    },

    /**
     * @description Undo the action of moving documents to another subset.
     * @param {String[]} documentIds - The moved document ids.
     * @param {String} targetSubsetId - The target subset id, where the documents were moved.
     */
    _undoMoveDocuments(documentIds, targetSubsetId) {

            // get documents from the provided ids
            let documents = documentIds.map(id => this.get('store').peekRecord('document', id));

            // get current subset
            let currentSubset = this.modelFor('dataset.subset');
            let targetSubset = this.get('store').peekRecord('subset', targetSubsetId);

            // promise container
            let promises = [];
            documents.forEach(document => {
                // remove subset from the document subsets array
                document.get('subsets').addObject(currentSubset);
                document.get('subsets').removeObject(targetSubset);
                // appropriately increment/decrement documentCount
                currentSubset.incrementProperty('documentCount');
                targetSubset.decrementProperty('documentCount');

                // save the modified document
                promises.push(document.save());
            });

            // update the subset modified state
            currentSubset.set('modified', true);
            targetSubset.set('modified', true);


            Promise.all(promises).then(() => {
                // once updated update the model
                this._updateModel();
            });
    },

    /**
     * @description Update the model.
     */
    _updateModel() {
        // request for data and update the model
        set(this.get('controller.model'), 'documents', null);
        this.model().then(model => this.set('controller.model', model));
    }


});
