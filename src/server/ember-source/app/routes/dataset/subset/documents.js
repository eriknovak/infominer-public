import Route from '@ember/routing/route';

export default Route.extend({

    // default parameters
    defaultPage: 1,
    defaultLimit: 10,

    sortTarget: null,

    // current parameters
    page: 1,
    limit: 10,

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
            this.set('sortTarget', null);
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

    afterModel(model) {
        // TODO: save field names for table sorting
        let fields = model.get('meta.fields');
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

            this.get('store').query('document', { page: this.get('page'), limit: this.get('limit'), sort: this.get('sortTarget') })
                .then(model => this.set('controller.model', model));

        },

        /**
         * Change the document page in the table and make a new request.
         * @param {Number} page - The page number of documents.
         */
        changePage(page) {
            // update the limit and transition to route
            this.set('page', page);
            this.get('store').query('document', { page: this.get('page'), limit: this.get('limit'), sort: this.get('sortTarget') })
                .then(model => this.set('controller.model', model));
        },

        /**
         * Sort the documents by the field.
         * @param {Object} params - The sort parameters.
         * @param {String} param.field - The field name.
         * @param {String} param.sortType - The sort type.
         */
        sortByField(params) {
            this.set('sortTarget', params);
            // TODO: manipulate sorting by field name
            this.get('store').query('document', { page: this.get('page'), limit: this.get('limit'), sort: this.get('sortTarget') })
                .then(model => this.set('controller.model', model));
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

            // if there are selected
            if (selectedDocs.get('length') > 0) {

                // create a new method
                const method = self.get('store').createRecord('method', {
                    methodType: 'filter.manual',
                    parameters: { documentIds: selectedDocs.map(doc => parseInt(doc.id)) },
                    result: { documentIds: selectedDocs.map(doc => parseInt(doc.id)) },
                    appliedOn: self.modelFor('dataset.subset')
                });
                // save method
                method.save().then(function () {
                    // create new subset
                    const subset = self.get('store').createRecord('subset', {
                        label: params.label,
                        description: params.description,
                        documents: selectedDocs,
                        resultedIn: method
                    });
                    // save subset
                    subset.save().then(() => {
                            Ember.$('#create-subset-documents-modal').modal('toggle');
                            self.transitionTo('dataset.subset.statistics', self.modelFor('dataset'), subset);
                        }).catch(error => {
                            console.log(error.message);
                        });
                    });

            } else {
                // TODO: send a message to the user - no documents selected
                console.log('No documents selected');
            }


        }

    }

});
