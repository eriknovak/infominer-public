import Component from '@ember/component';
import { computed, get, set } from '@ember/object';
import $ from 'jquery';

export default Component.extend({
    // component attributes
    classNames: ['modal', 'analysis-modal'],
    attributeBindings: ['tabindex', 'role'],
    tagName: 'div',
    tabindex: -1,
    role: 'dialog',

    renderComponentName: computed('selectedMethod', function () {
        return this.get('selectedMethod').replace(/\./g, '-');
    }),

    init() {
        this._super(...arguments);
        set(this, 'availableMethods', [
            { method: 'clustering.kmeans', name: 'clustering' },
            { method: 'clustering.activelearning', name: 'active learning' },
            { method: 'visualization', name: 'visualization' },
        ]);
        set(this, 'selectedMethod', this.get('availableMethods').objectAt(0).method);
        set(this, 'parameters', {});
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        // change the method options
        changeMethodSelection(value) {
            set(this, 'parameters', {});
            this.set('selectedMethod', value);
        },

        // send the method parameters to the user
        startAnalysis() {

            // prepare parameters placeholder
            let parameters;
            // get method parameters
            let methodType = this.get('selectedMethod');
            if (methodType.includes('clustering')) {
                parameters = this._prepareClusteringParams();
            } else if (methodType.includes('visualization')) {
                parameters = this._prepareVisualizationParams();
            }
            // send the parameters to the route
            if (methodType.includes('clustering.kmeans') && parameters.fields.length ||
                methodType.includes('visualization')) {
                // parameters are set - make a method request
                this.get('startAnalysis')({ methodType, parameters });
            } else if (methodType.includes('clustering.activelearning') && parameters.method.queryText) {
                this.get('startActiveLearning')({ queryText: parameters.method.queryText });
            } else {
                // there are no fields selected - warn the user
                $('#analysis-warning').removeClass('d-none');
            }
        }
    },

    _prepareClusteringParams() {
        const parameters = this.get('parameters');
        // get feature parameters
        let response = { };
        if (this.get('selectedMethod') !== 'clustering.activelearning') {
            let fields = get(parameters, 'features')
                .filterBy('included', true)
                .map(param => get(param, 'field'));
            response.fields = fields;
        }
        // get method parameters
        response.method = get(parameters, 'method');

        return response;
    },

    _prepareVisualizationParams() {
        const parameters = this.get('parameters');
        // get method parameters
        let method = get(parameters, 'method');
        return { method };
    }

});
