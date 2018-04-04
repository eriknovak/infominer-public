import Component from '@ember/component';
import { observer, computed, set } from '@ember/object';

export default Component.extend({
    // component attributes
    classNames: ['subset', 'child'],
    classNameBindings: ['parent'],
    collapsed: false,
    parent: false,

    _parentState: observer('subset.usedBy.@each.produced', function () {
        this.get('usedBy').then(methods => {
            let producedSubsets = methods.filter((item) => {
                return item.hasMany('produced').ids().length > 0;
            });
            let isParent = producedSubsets.get('length') > 0;
            this.set('parent', isParent);
        });
    }),

    ontology: computed('subset.usedBy', function () {
        return this.get('usedBy').filter(method => {
            return method.get('methodType').includes('clustering') ||
                   method.get('methodType').includes('filter');
        });
    }),

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        set(this, 'collapsed', false);
        set(this, 'parent', false);
        set(this, 'featureOptions', { });
    },

    didReceiveAttrs() {
        let self = this;
        self._super(...arguments);
        const methods = self.get('usedBy');
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
