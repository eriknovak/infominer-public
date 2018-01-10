import Route from '@ember/routing/route';

export default Route.extend({

    model(params) {
        // get the subset info
        return this.get('store').findRecord('subset', params.subset_id);
    },

    redirect(model) {
        this.transitionTo('dataset.subset.analysis', model);
    }

});
