import Component from '@ember/component';
import { observer } from '@ember/object';

export default Component.extend({
    // component attributes
    classNames: ['subset', 'child'],
    classNameBindings: ['parent'],
    collapsed: false,
    parent: false,

    parentState: observer('subset.usedBy.@each.[]', function () {
        // console.log('parentState', this.get('subset.id'));

        this.get('subset.usedBy').then(methods => {
            let producedSubsets = methods.filter((item, index, self) => {
                return item.hasMany('produced').ids().length > 0;
            });
            // console.log(producedSubsets);
            let isParent = producedSubsets.get('length') > 0;
            // console.log(isParent);
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
        const subset = self.get('subset');
        // subset contains methods that produced new subset
        let methods = subset.get('usedBy');
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
