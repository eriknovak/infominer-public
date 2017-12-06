import Component from '@ember/component';

export default Component.extend({
    classNames: ['method', 'child'],
    classNameBindings: ['parent'],
    parent: false,
    collapsed: false,

    didReceiveAttrs() {
        this._super(...arguments);
        const method = this.get('method');
        if (method.hasMany('produced').ids() > 0) { this.set('parent', true); }
    },


    actions: {
        toggleBranch() {
            this.toggleProperty('collapsed');
        }
    }
});
