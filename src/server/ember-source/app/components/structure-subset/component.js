import Component from '@ember/component';

export default Component.extend({
    classNames: ['subset', 'child'],
    classNameBindings: ['parent'],
    parent: false,
    collapsed: false,

    didReceiveAttrs() {
        this._super(...arguments);
        const subset = this.get('subset');
        if (subset.hasMany('usedBy').ids() > 0) { this.set('parent', true); }
    },

    actions: {
        toggleBranch() {
            this.toggleProperty('collapsed');
        }
    }
});
