import Route from '@ember/routing/route';
import ENV from '../config/environment';
import UnauthenticatedRouteMixin from 'ember-simple-auth/mixins/unauthenticated-route-mixin';

/**
 * For development do not use authentication.
 * for other environments (production) user authentication.
 */
const LoginRoute = ENV.environment === 'development' ?
    Route.extend({ }) :
    Route.extend(UnauthenticatedRouteMixin);

export default LoginRoute.extend({
    // hostname url used for authentication
    hostnameURL: ENV.APP.HOSTNAME,

    model() {
        this._super(...arguments);
        // set login authentication urls
        return {
            googleAuth: `${this.get('hostnameURL')}/auth/google`,
            twitterAuth: `${this.get('hostnameURL')}/auth/twitter`
        };
    }

});
