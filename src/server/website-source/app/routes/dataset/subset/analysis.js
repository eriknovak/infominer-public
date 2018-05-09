import Route from '@ember/routing/route';
import $ from 'jquery';

export default Route.extend({

    model() {
        let subset = this.modelFor('dataset.subset');
        let dataset = this.modelFor('dataset');
        return { subset, dataset };
    },

    actions: {
        /**
         * Starts the analysis.
         * @param {Object} analysisParams - Parameters for the analysis.
         */
        startAnalysis(analysisParams) {
            let self = this;
            // toggle the modal - giving the user control
            $('.modal.analysis-modal').modal('toggle');
            // get parent subset - to save method
            let parentSubset = self.modelFor('dataset.subset');
            // create a new method
            const method = self.get('store').createRecord('method', {
                id: self.get('store').peekAll('method').get('length'),
                methodType: analysisParams.methodType,
                parameters: analysisParams.parameters,
                appliedOn: parentSubset
            });
            // save the model
            method.save();
        },

        /**
         * Creates a subset and stores it on the backend.
         * @param {Object} subsetInfo - The subset information parameters.
         */
        createSubset(subsetInfo) {
            let self = this;
            // toggle the modal - giving the user control
            $(`#${subsetInfo.modalId}`).modal('toggle');
            // update method internal state
            this.get('store').findRecord('method', subsetInfo.methodId).then(method => {
                // create new subset
                const subset = self.get('store').createRecord('subset', {
                    id: self.get('store').peekAll('subset').get('length'),
                    label: subsetInfo.label,
                    description: subsetInfo.description,
                    resultedIn: method,
                    clusterId: subsetInfo.clusterId,
                    documentCount: subsetInfo.documentCount
                });
                // save the cluster
                subset.save().then(() => {
                    this.transitionTo('dataset.subset', subset);
                });
            });
        }
    }

});
