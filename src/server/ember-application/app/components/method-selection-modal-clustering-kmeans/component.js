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
        set(this, 'distanceMetrics', [
            { fullName: 'Euclidian', name: 'Euclid' },
            { fullName: 'Cosine', name: 'Cos' }
        ]);
        set(this, 'chosenMetrics', 'Euclid');
        set(this, 'k', 2);
    },

    didReceiveAttrs() {
        this._super(...arguments);
        // set the parameters of the method
        this._setParameters();
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    _observeParameterChanges: observer('chosenMetrics', 'k', function () {
        once(this, '_setParameters');
    }),

    actions: {
        // sets the distance metrics
        selectDistanceMetrics(index) {
            let chosenMetrics = get(this.get('distanceMetrics').objectAt(index), 'name');
            this.set('chosenMetrics', chosenMetrics);
        },

        // sets the number of clusters
        selectNumberOfClusters(number) {
            let k = parseInt(number) < 2 ? 2 : parseInt(number);
            this.set('k', k);
        }
    },

    ///////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////

    _setParameters() {
        // set parameter values
        this.set('parameters.method', { distanceType: this.get('chosenMetrics'),  k: this.get('k') });

    }
});
