import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import $ from 'jquery';

export default Component.extend({
    // component attributes
    classNames: ['method', 'child'],
    classNameBindings: ['parent'],
    parent: false,
    collapsed: false,

    // services
    store: service('store'),

    // parameters
    ontology: computed('method.produced.length', function () {
        // ontology placeholder
        let ontology = [];

        const method = this.get('method');
        if (!method.get('produced.length')) { return ontology; }
        // method is a clustering method - get all results
        for (let i = 0; i < method.get('produced.length'); i++) {
            let subset = method.get('produced').objectAt(i);
            ontology.push({ created: true, subset });
        }

        return ontology;
    }),

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didReceiveAttrs() {
        this._super(...arguments);
        const method = this.get('method');
        if (method.hasMany('produced').ids().length > 0) { this.set('parent', true); }

        // get the fields used for feature space creation
        if (method.get('parameters.fields')) {
            let selectedFields = method.get('parameters.fields').join(', ');
            this.set('selectedFields', selectedFields);
            this.set('initialQuery', method.get('parameters.initQuery'));
            this.set('clustering-k', method.get('parameters.method.k'));
        }
    },

    didInsertElement() {
        let self = this;
        self._super(...arguments);
        $(`#structure-method-${self.get('method.id')}`).hover(
            function () { $(`#delete-method-${self.get('method.id')}`).addClass('show'); },
            function () { $(`#delete-method-${self.get('method.id')}`).removeClass('show'); }
        );
    },

    didUpdate() {
        let self = this;
        self._super(...arguments);
        $(`#structure-method-${self.get('method.id')}`).hover(
            function () { $(`#delete-method-${self.get('method.id')}`).addClass('show'); },
            function () { $(`#delete-method-${self.get('method.id')}`).removeClass('show'); }
        );
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
