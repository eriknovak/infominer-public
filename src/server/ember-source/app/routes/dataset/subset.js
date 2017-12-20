import Route from '@ember/routing/route';

export default Route.extend({

    model(params) {
        console.log('subset');
        // get the subset info
        return this.get('store').findRecord('subset', params.subset_id);
    },

    redirect(model) {
        // get method that created the subset
        // let methodId = model.belongsTo('resultedIn').id();
        // if (methodId) { this.get('store').findRecord('method', methodId); }
        // let usedByIds = model.hasMany('usedBy').ids();
        // for (let id of usedByIds) { this.get('store').findRecord('method', id); }
        // transition to the subset
        console.log('aftermodel');
        this.transitionTo('dataset.subset.analysis', model);
    }

});
