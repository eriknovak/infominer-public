import Component from '@ember/component';
import { observer, set } from '@ember/object';
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
            { fullName: 'Text', name: 'text', type: 'string' },
            { fullName: 'Number', name: 'number', type: 'float' }
        ]);
        // set default clustering type
        set(this, 'chosenClusteringType', this.get('clusteringTypes').objectAt(0));
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
            let chosenType = this.get('clusteringTypes').objectAt(index);
            this.set('chosenClusteringType', chosenType);
        }
    },

    ///////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////

    _setParameters() {
        // set parameter values
        this.set('parameters.method', { 
            clusteringType: this.get('chosenClusteringType.name'), 
            k: this.get('k') 
        });
    }
});
