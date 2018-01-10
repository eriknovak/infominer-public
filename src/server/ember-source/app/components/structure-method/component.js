import Component from '@ember/component';

export default Component.extend({
    // component attributes
    classNames: ['method', 'child'],
    classNameBindings: ['parent'],
    parent: false,
    collapsed: false,

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didReceiveAttrs() {
        this._super(...arguments);
        const method = this.get('method');
        if (method.hasMany('produced').ids().length > 0) { this.set('parent', true); }
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        /**
         * Toggle branch collapse.
         */
        toggleBranch() {
            this.toggleProperty('collapsed');
        }
    }
});
