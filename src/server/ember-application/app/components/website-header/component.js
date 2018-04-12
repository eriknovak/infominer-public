import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
    classNames: ['navbar', 'navbar-expand-sm', 'fixed-top'],
    tagName: 'nav',
    // services
    session: service('session'),

    actions: {
        // invalidate session login
        invalidateSession() {
            this.get('session').invalidate();
        }
    }
});
