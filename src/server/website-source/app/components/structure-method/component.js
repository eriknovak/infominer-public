import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({
    // component attributes
    classNames: ['method', 'child'],
    classNameBindings: ['parent'],
    parent: false,
    collapsed: false,

    // services
    store: service('store'),

    // parameters
    ontology: computed('method.result', function () {
        // ontology placeholder
        let ontology = [];

        const method = this.get('method');
        if (method.get('methodType').includes('clustering')) {
            // method does not have any results at the moment
            if (!method.get('result')) { return ontology; }
            // method is a clustering method - get all results
            for (let cluster of method.get('result.clusters')) {
                // create a subset
                let clusterObj = { subsetCreated: cluster.subsetCreated };
                if (clusterObj.subsetCreated) {
                    clusterObj.subset = this.get('store').peekRecord('subset', cluster.subsetId);
                } else {
                    clusterObj.subsetLabel = cluster.clusterLabel;
                }
                // add cluster info to ontology
                ontology.push(clusterObj);
            }
        } else if (method.get('methodType').includes('filter')) {
            // method is a filtering method - again get all results
            for (let i = 0; i < method.get('produced.length'); i++) {
                let subset = method.get('produced').objectAt(i);
                ontology.push({ subsetCreated: true, subset });
            }
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
        if (method.get('parameters.features')) {
            let fields = method.get('parameters.features').map(feature => feature.field);
            this.set('selectedFields', fields.join(', '));
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
