import Route from '@ember/routing/route';

export default Route.extend({

    model(params) {
        // modify namespace for subset model
        console.log(this.paramsFor('dataset'));
        console.log(this.modelFor('subset'));
        let { dataset_id } = this.paramsFor('dataset');
        // console.log(this.modelFor(this.routeName));
        // let { subset_id } = this.paramsFor('subset');
        // console.log(dataset_id, subset_id);
        // this.store.adapterFor('document').set('namespace', `api/datasets/${dataset_id}/subsets/${subset_id}`);
        // // get the subset info
        // return this.get('store').query('document', { page: 1 });
    }

});
