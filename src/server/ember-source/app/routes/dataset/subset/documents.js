import Route from '@ember/routing/route';

export default Route.extend({

    // default parameters
    defaultPage: 1,
    defaultLimit: 10,

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
            this.set('page', this.defaultPage);
            this.set('limit', this.defaultlimit);
            // unload document store - create clean slate for new request
            this.store.unloadAll('document');
        }
        // set adapter for documents
        documentAdapter.set('namespace', namespace);
    },

    model() {
        // get documents
        return this.get('store').query('document', { page: this.get('page'), limit: this.get('limit') });
    },

    actions: {
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

            this.get('store').query('document', { page: this.get('page'), limit: this.get('limit') })
                .then(model => this.set('controller.model', model));

        },

        changePage(page) {
            // update the limit and transition to route
            this.set('page', page);
            this.get('store').query('document', { page: this.get('page'), limit: this.get('limit') })
                .then(model => this.set('controller.model', model));
        },

        createSubset(params) {
            let self = this;
            // get subset label
            const subsetLabel = params.label;
            const subsetDescription = params.description;

            // get local documents
            const selectedDocs = self.get('store').peekAll('document').filterBy('selected', true);

            // if there are selected
            if (selectedDocs.get('length') > 0) {

                // get subset ids and methods
                Ember.RSVP.hash({
                    subsets: self.get('store').findAll('subset'),
                    methods: self.get('store').findAll('method')
                }).then(datasets => ({
                    subsetId: datasets.subsets.get('length') ? datasets.subsets.get('length') : 0,
                    methodId: datasets.methods.get('length') ? datasets.methods.get('length') : 0
                })).then(ids => {
                    // create a new method
                    const newMethod = self.get('store').createRecord('method', {
                        id: ids.methodId,
                        methodType: 'filter.manual',
                        parameters: { documentIds: selectedDocs.map(doc => parseInt(doc.id)) },
                        result: { documentIds: selectedDocs.map(doc => parseInt(doc.id)) },
                        appliedOn: self.modelFor('dataset.subset')
                    });
                    // save method
                    newMethod.save().then(function () {
                        // create new subset
                        const newSubset = self.get('store').createRecord('subset', {
                            id: ids.subsetId,
                            label: subsetLabel,
                            description: subsetDescription,
                            documents: selectedDocs,
                            resultedIn: newMethod
                        });
                        // save subset
                        newSubset.save()
                            .then(() => {
                                Ember.$('.modal-backdrop').remove();
                                self.transitionTo('dataset.subset.statistics', self.modelFor('dataset'), newSubset);
                            }).catch(error => {
                                console.log(error.message);
                            });
                        });



                });

            } else {
                // TODO: send a message to the user - no documents selected
                console.log('No documents selected');
            }


        }

    }

});
