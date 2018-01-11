import Route from '@ember/routing/route';

export default Route.extend({

    beforeModel() {
        // redirect to '/datasets'
        this._super(...arguments);
        this.replaceWith('dataset.subset.analysis', this.modelFor('dataset'), 0);
    }

});
