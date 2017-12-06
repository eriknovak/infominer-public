import Component from '@ember/component';

export default Component.extend({
    classNames: ['subset'],

    collapsed: false,

    actions: {
        toggleBranch() {
            this.toggleProperty('collapsed');
        }
    }
});
