import Route from '@ember/routing/route';
import $ from 'jquery';

export default Route.extend({

    model() {
        let subset = this.modelFor('dataset.subset');
        let dataset = this.modelFor('dataset');
        return { subset, dataset, subsetCreationParams: { }, clusterValues: { } };
    },

    actions: {
        /**
         * Starts the analysis.
         * @param {Object} params - Parameters for the analysis.
         */
        startAnalysis(params) {
            let self = this;
            // toggle the modal - giving the user control
            $('.modal.analysis-modal').modal('toggle');
            // get parent subset - to save method
            let parentSubset = self.modelFor('dataset.subset');
            // create a new method
            const method = self.get('store').createRecord('method', {
                id: self.get('store').peekAll('method').get('length'),
                methodType: params.methodType,
                parameters: params.parameters,
                appliedOn: parentSubset
            });
            // save the model
            method.save();
        },

        /**
         * Creates a subset and stores it on the backend.
         * @param {Object} params - The subset information parameters.
         */
        createSubset(params) {
            let self = this;
            // update method internal state
            this.get('store').findRecord('method', params.methodId).then(method => {
                // create new subset
                const subset = self.get('store').createRecord('subset', {
                    id: self.get('store').peekAll('subset').get('length'),
                    label: params.label,
                    description: params.description,
                    resultedIn: method,
                    clusterId: params.clusterId,
                    documentCount: params.documentCount
                });

                // save the cluster
                subset.save().then(() => {
                    // toggle the modal - giving the user control
                    $('#subset-create-modal').modal('toggle');
                    $(`#subset-create-modal .modal-footer .btn-primary`).html('Save Subset');
                    this.transitionTo('dataset.subset', subset);
                });
            });
        }
    }

});
