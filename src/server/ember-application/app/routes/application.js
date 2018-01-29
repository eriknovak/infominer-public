import Route from '@ember/routing/route';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';

import ENV from '../config/environment';
import { inject as service } from '@ember/service';

/**
 * For development do not use authentication.
 * for other environments (production) user authentication.
 */
const ApplicationRoute = ENV.environment === 'development' ?
    Route.extend({ }) :
    Route.extend(ApplicationRouteMixin);


export default ApplicationRoute.extend({
    authenticationEndpoint: `${ENV.APP.HOSTNAME}/auth/account`,

    session: service('session'),

    beforeModel() {
        let self = this;
        // redirect to '/datasets'
        self._super(...arguments);

        if (ENV.environment === 'development') {
            console.log(self.get('session.data'));
            self.replaceWith('datasets');
        } else {
            self._checkAuthentication();
        }
    },

    /**
     * Checks the authentication.
     */
    _checkAuthentication() {
        let self = this;
        // check if user is authenticated in backend
        Ember.$.get(self.get('authenticationEndpoint'))
            .then(data => {
                console.log(data);
                if (data.authenticated) {
                    self.get('session').authenticate('authenticator:application', data.user)
                        .then(() => { self.replaceWith('datasets'); });
                } else {
                    if (self.get('session').isAuthenticated) {
                        self.replaceWith('datasets');
                    } else {
                        self.replaceWith('login');
                    }
                }
            });
    }


});
