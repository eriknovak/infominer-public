import Component from '@ember/component';
import { set } from '@ember/object';

export default Component.extend({
    classNames: ['cluster-content'],

    init() {
        this._super(...arguments);
        set(this, 'collapsed', false);
    },

    actions: {
        toggleInformation() { this.toggleProperty('collapsed'); }
    }
});
