import Component from '@ember/component';
import { observer, computed, set } from '@ember/object';
import $ from 'jquery';

export default Component.extend({
    // component attributes
    classNames: ['subset', 'child'],
    classNameBindings: ['parent'],

    _parentState: observer('subset.usedBy.@each.produced', function () {
        this.get('usedBy').then(methods => {
            let producedSubsets = methods.filter((item) => {
                return item.hasMany('produced').ids().length > 0;
            });
            let isParent = producedSubsets.get('length') > 0;
            this.set('parent', isParent);
        });
    }),

    ontology: computed('subset.usedBy.@each', function () {
        return this.get('usedBy').filter(method => {
            return method.get('methodType') &&
                (method.get('methodType').includes('clustering') ||
                method.get('methodType').includes('filter') ||
                method.get('methodType').includes('classify'));
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

    didInsertElement() {
        let self = this;
        self._super(...arguments);
        // on hover show edit button
        if (!self.get('subset.isRoot')) {
            $(`#structure-subset-${self.get('subset.id')}`).hover(
                function () { $(`#delete-subset-${self.get('subset.id')}`).addClass('show'); },
                function () { $(`#delete-subset-${self.get('subset.id')}`).removeClass('show'); }
            );
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
