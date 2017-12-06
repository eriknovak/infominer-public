import Component from '@ember/component';

export default Component.extend({
    classNames: ['method'],

    collapsed: false,

    actions: {
        toggleBranch() {
            this.toggleProperty('collapsed');
        }
    }
});
