import Base from 'ember-simple-auth/authorizers/base';
import { inject as service } from '@ember/service';
import { isEmpty } from '@ember/utils';

export default Base.extend({
    session: service('session'),

    // TODO: fix data authorization
    authorize(sessionData, block) {
        const accessToken = sessionData.id;
        if (this.get('session.isAuthenticated') && !isEmpty(accessToken)) {
            block('Authorization', accessToken);
        }
    }
});