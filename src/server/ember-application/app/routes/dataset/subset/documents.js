import Route from '@ember/routing/route';
import $ from 'jquery';

export default Route.extend({

    // default parameters
    defaultPage: 1,
    defaultLimit: 10,
    defaultSortTarget: null,

    // current parameters
    page: 1,
    limit: 10,
    sortTarget: null,

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
            // set all documents as un-selected
            this.get('store').peekAll('document')
                .forEach(doc => doc.set('selected', false));

            // set adapter for documents
            documentAdapter.set('namespace', namespace);
        }
    },

    model() {
        // get documents
        return this.get('store').query('document', { page: this.get('page'), limit: this.get('limit'), sort: this.get('sortTarget') });
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
        }
    },

    // helper functions
    _updateModel() {
        // empty table and add a loading row
        this.set('controller.model.loading', true);

        // request for data and update the model
        this.get('store').query('document', { page: this.get('page'), limit: this.get('limit'), sort: this.get('sortTarget') })
            .then(model => this.set('controller.model', model));
    }


});
