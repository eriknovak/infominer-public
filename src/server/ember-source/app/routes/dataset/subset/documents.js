import Route from '@ember/routing/route';

export default Route.extend({

    // default parameters
    defaultPage: 1,
    defaultLimit: 10,

    // current parameters
    page: 1,
    limit: 10,

    model(params, transition) {
        // modify namespace for subset model
        let { dataset_id } = transition.params.dataset;
        let { subset_id } = transition.params['dataset.subset'];
        // construct namespace
        const namespace = `api/datasets/${dataset_id}/subsets/${subset_id}`;
        // check if in same namespace - accordingly change page and limit
        if (this.store.adapterFor('document').get('namespace') !== namespace) {
            this.set('page', this.defaultPage);
            this.set('limit', this.defaultlimit);
            // unload document store - create clean slate for new request
            this.store.unloadAll('document');
        }
        // set adapter for documents
        this.store.adapterFor('document').set('namespace', namespace);
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
        }
    }

});
