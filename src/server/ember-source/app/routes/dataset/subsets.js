import Route from '@ember/routing/route';

export default Route.extend({

    beforeModel() {
        // redirect to '/datasets'
        this._super(...arguments);
        this.transitionTo('dataset.subset.statistics', 0);
    }

});
