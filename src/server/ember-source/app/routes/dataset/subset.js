import Route from '@ember/routing/route';

export default Route.extend({

    model(params) {
        // get the subset info
        return this.get('store').findRecord('subset', params.subset_id);
    },

    afterModel(model) {
        // get method that created the subset
        let methodId = model.belongsTo('resultedIn').id();
        if (methodId) { this.get('store').findRecord('method', methodId); }

        // transition to the subset
        this.transitionTo('dataset.subset.analysis', model);
    }

});
