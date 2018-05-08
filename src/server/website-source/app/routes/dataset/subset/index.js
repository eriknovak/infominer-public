import Route from '@ember/routing/route';

export default Route.extend({

    redirect() {
        let model = this.modelFor('dataset.subset');
        this.transitionTo('dataset.subset.analysis', model);
    }
});
