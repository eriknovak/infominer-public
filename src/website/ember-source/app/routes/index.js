import Route from '@ember/routing/route';

export default Route.extend({

    beforeModel() {
        // redirect to /datasets path
        this._super(...arguments);
        this.transitionTo('datasets');
    }
});
