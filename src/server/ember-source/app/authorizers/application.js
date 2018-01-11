import Base from 'ember-simple-auth/authorizers/base';
import { inject as service } from '@ember/service';

export default Base.extend({
    session: service('session'),

    authorize(sessionData, block) {
        const accessToken = sessionData.id;
        if (this.get('session.isAuthenticated') && !Ember.isEmpty(accessToken)) {
            block('Authorization', accessToken);
        }
    }
});