import Route from '@ember/routing/route';
import $ from 'jquery';

export default Route.extend({

    // default parameters
    defaultPage: 1,
    defaultLimit: 10,
    defaultSortTarget: null,
    defaultQuery: null,

    // current parameters
    page: 1,
    limit: 10,
    sortTarget: null,
    query: null,

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
        // get documents
        return this.get('store').query('document', query)
            .then(documents => ({
                documents,
                metadata: documents.meta
            }));
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
            const pagination = this.get('controller.model.meta.pagination');
            // calculage the new maxpage value
            let maxPage = pagination.documentCount / limit;
            if (maxPage % 1 !== 0) { maxPage = Math.floor(maxPage) + 1; }
            // change page value if not in bound
            if (pagination.page > maxPage) { this.set('page', maxPage); }
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
            console.log(params);
            // update model
            this._updateModel();
        },

        /**
         * Creates the subset out of the selected documents.
         * @param {Object} params - The subset information.
         * @param {String} param.label - The subset label.
         * @param {String} param.description - The subset description.
         */
        createSubset(params) {
            let self = this;
            // get local documents
            const selectedDocs = self.get('store').peekAll('document').filterBy('selected', true);

            // get warning container
            let warningContent = $('#create-subset-documents-modal div.warning');
            // empty warning container
            warningContent.empty();

            if (params.label.length === 0) {
                // TODO: notify the user the subset label is missing
                warningContent.append('<p class="warning-content">No subset name found</p>');
            }

            if (selectedDocs.get('length') === 0) {
                // TODO: notify user there were no documents selected
                warningContent.append('<p class="warning-content">No documents were selected</p>');
            }

            // if there are selected documents and label given
            if (params.label.length > 0 && selectedDocs.get('length') > 0) {
                // get parent subset - to save method
                let parentSubset = self.modelFor('dataset.subset');

                // create a new method
                const method = self.get('store').createRecord('method', {
                    id: self.get('store').peekAll('method').get('length'),
                    methodType: 'filter.manual',
                    parameters: { docIds: selectedDocs.map(doc => parseInt(doc.id)) },
                    appliedOn: parentSubset
                });

                // create new subset
                const subset = self.get('store').createRecord('subset', {
                    id: self.get('store').peekAll('subset').get('length'),
                    label: params.label,
                    description: params.description,
                    documents: selectedDocs,
                    documentCount: selectedDocs.get('length'),
                    resultedIn: method
                });

                $('#create-subset-documents-modal').modal('toggle');
                // save method
                method.save().then(function () {
                    // save subset
                    subset.save().then(function () {
                            // hide modal and transition to new route
                            self.transitionTo('dataset.subset', self.modelFor('dataset'), subset.id);
                        }).catch(error => {
                            console.log(error.message);
                        });
                    });

            }
        },

        changeQuery(params) {
            // check what are the parameters
            const query = { };
            if (params.text) { query.text = params.text; }
            if (params.number.length) { query.number = params.number; }
            
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
