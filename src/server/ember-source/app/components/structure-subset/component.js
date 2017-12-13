import Component from '@ember/component';
import { observer } from '@ember/object';

export default Component.extend({
    // component attributes
    classNames: ['subset', 'child'],
    classNameBindings: ['parent'],
    collapsed: false,
    parent: false,

    parentState: observer('subset.usedBy.@each.[]', function () {
        this.get('subset.usedBy').then(methods => {
            let producedSubsets = methods.filter((item, index, self) => {
                return item.hasMany('produced').ids().length > 0;
            });
            let isParent = producedSubsets.get('length') > 0;
            this.set('parent', isParent);
        });
    }),

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        this.set('collapsed', false);
        this.set('parent', false);
    },

    didReceiveAttrs() {
        let self = this;
        self._super(...arguments);
        const methods = self.get('subset.usedBy');
        // subset contains methods that produced new subset
        for (let i = 0; i < methods.get('length'); i++) {
            let method = methods.objectAt(i);
            if (method.hasMany('produced').ids().length > 0) { self.set('parent', true); break; }
        }
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
