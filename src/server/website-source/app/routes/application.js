import Route from '@ember/routing/route';

import ENV from '../config/environment';
import { inject as service } from '@ember/service';
import $ from 'jquery';


export default Route.extend({
    authenticationEndpoint: `${ENV.APP.HOSTNAME}/auth/account`,

    session: service('session'),

    beforeModel() {
        let self = this;

        // redirect to '/datasets'
        self._super(...arguments);
        self.replaceWith('datasets');
    }

});
