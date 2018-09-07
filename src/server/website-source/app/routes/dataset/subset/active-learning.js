import Route from '@ember/routing/route';

export default Route.extend({

    queryParams: {
        queryText: {
          refreshModel: true
        }
    },

    // current parameters
    page: 1,
    limit: 20,

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
            // set all documents as un-selected
            this.get('store').peekAll('document')
                .forEach(doc => doc.set('selected', false));

            // set adapter for documents
            documentAdapter.set('namespace', namespace);
        }
    },

    model(params) {
        let query = { };
        if (this.get('page')) { query.page = this.get('page'); }
        if (this.get('limit')) { query.limit = this.get('limit'); }
        if (params.queryText) {
            query.query = {
                text: {
                    keywords: params.queryText,
                    fields: this.modelFor('dataset').get('fields')
                                .filter(field => field.type === 'string')
                                .map(field => field.name)
                }
            };
            // get documents
            return this.get('store').query('document', query)
                .then(documents => {
                    return {
                        documents,
                        params,
                        dataset: this.modelFor('dataset')
                    };
                });

        }
        return { params };
    },


    actions: {



    }

});
