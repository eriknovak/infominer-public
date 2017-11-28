import Route from '@ember/routing/route';

export default Route.extend({

    model(params, transition) {
        // modify namespace for subset model
        let { dataset_id } = transition.params['dataset'];
        let { subset_id } = transition.params['dataset.subset'];

        this.store.adapterFor('document').set('namespace', `api/datasets/${dataset_id}/subsets/${subset_id}`);
        // get the subset info
        return this.get('store').query('document', { page: 1 });
    }

});
