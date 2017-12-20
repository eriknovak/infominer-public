import Route from '@ember/routing/route';

export default Route.extend({

    beforeModel() {
        // redirect to '/datasets'
        this._super(...arguments);
        console.log('subsets');
        this.transitionTo('dataset.subset.analysis', 0);
    }

});
