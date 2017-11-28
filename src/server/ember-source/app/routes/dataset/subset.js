import Route from '@ember/routing/route';

export default Route.extend({

    model(params) {
        console.log(params);
        // modify namespace for subset model
        let { dataset_id } = this.paramsFor('dataset');
        this.store.adapterFor('subset').set('namespace', `api/datasets/${dataset_id}`);
        // get the subset info
        return this.get('store').findRecord('subset', params.subset_id, { reload: true });
    }

});
