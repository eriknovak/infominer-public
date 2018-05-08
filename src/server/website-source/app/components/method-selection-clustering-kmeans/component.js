import Component from '@ember/component';
import { observer, get, set } from '@ember/object';
import { once } from '@ember/runloop';

export default Component.extend({
    // component attributes

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        // set default cluster number
        set(this, 'k', 2);
        // set possible clustering types
        set(this, 'clusteringTypes', [
            { fullName: 'Text', name: 'text' },
            { fullName: 'Number', name: 'number' }
        ]);
        // set default clustering type
        set(this, 'chosenClusteringType', 'text');
    },

    didReceiveAttrs() {
        this._super(...arguments);
        // set the parameters of the method
        this._setParameters();
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    _observeParameterChanges: observer('chosenClusteringType', 'k', function () {
        once(this, '_setParameters');
    }),

    actions: {

        // sets the number of clusters
        selectNumberOfClusters(number) {
            let k = parseInt(number) < 2 ? 2 : parseInt(number);
            this.set('k', k);
        },

        // sets the clustering type
        selectClusteringType(index) {
            let chosenType = get(this.get('clusteringTypes').objectAt(index), 'name');
            this.set('chosenClusteringType', chosenType);
        }
    },

    ///////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////

    _setParameters() {
        // set parameter values
        this.set('parameters.method', { clusteringType: this.get('chosenClusteringType'),  k: this.get('k') });

    }
});
