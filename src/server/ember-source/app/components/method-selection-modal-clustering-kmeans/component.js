import Component from '@ember/component';
import { observer } from '@ember/object';

export default Component.extend({
    // component attributes

    // parameter options
    distanceMetrics: [
        { fullName: 'Euclidian', name: 'Euclid' },
        { fullName: 'Cosine', name: 'Cos' }
    ],

    // method parameters
    chosenMetrics: 'Euclid',
    k: 2,

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didReceiveAttrs() {
        this._super(...arguments);
        // set the parameters of the method
        this._setParameters();
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    _observeParameterChanges: observer('chosenMetrics', 'k', function () {
        Ember.run.once(this, '_setParameters');
    }),

    actions: {
        // sets the distance metrics
        selectDistanceMetrics(index) {
            let chosenMetrics = Ember.get(this.get('distanceMetrics').objectAt(index), 'name');
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
        this.set('methodParameters.type', 'clustering.kmeans');
        this.set('methodParameters.parameters.method', { distanceType: this.get('chosenMetrics'),  k: this.get('k') });

    }
});
