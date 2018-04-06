import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
    // services
    session: service('session'),

    actions: {
        // invalidate session login
        invalidateSession() {
            this.get('session').invalidate();
        }
    }
});
