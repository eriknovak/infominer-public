import Route from '@ember/routing/route';

export default Route.extend({

    queryParams: {
        page: {
            replace: true,
            refreshModel: true
        },
        limit: {
            replace: true,
            refreshModel: true
        }
    },

    page: 1,
    limit: 10,

    model(params, transition) {
        // modify namespace for subset model
        let { dataset_id } = transition.params.dataset;
        let { subset_id } = transition.params['dataset.subset'];
        // set adapter for documents
        this.store.adapterFor('document').set('namespace', `api/datasets/${dataset_id}/subsets/${subset_id}`);
        // get initial documents
        return this.get('store').query('document', { page: this.get('page'), limit: this.get('limit') });
    },

    actions: {
        changeLimit(limit) {
            // update the limit and transition to route
            this.set('limit', limit);
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
