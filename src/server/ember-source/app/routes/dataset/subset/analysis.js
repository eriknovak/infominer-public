import Route from '@ember/routing/route';

export default Route.extend({

    beforeModel() {
        this.get('store').findRecord('subset', 0);
    },

    model(params, transition) {
        // get subset id
        let { subset_id } = transition.params['dataset.subset'];
        // get methods that used the subset with subset_id
        return this.get('store').findRecord('subset', subset_id);
    },

    afterModel(model) {
        // get methods that used this subset
        let analysisMethod = model.hasMany('usedBy').ids();
        for (let id of analysisMethod) {
            this.get('store').findRecord('method', id);
        }
    }


});
