import Route from '@ember/routing/route';

export default Route.extend({

    model() {
        let subset = this.modelFor('dataset.subset');
        let dataset = this.modelFor('dataset');
        return { subset, dataset };
    },

    actions: {
        /**
         *
         * @param {Object} analysisParams - Parameters for the analysis.
         */
        startAnalysis(analysisParams) {
            let self = this;
            // get parent subset - to save method
            let parentSubset = self.modelFor('dataset.subset');
            // create a new method
            const method = self.get('store').createRecord('method', {
                id: self.get('store').peekAll('method').get('length'),
                methodType: analysisParams.methodType,
                parameters: analysisParams.parameters,
                appliedOn: parentSubset
            });

            method.save().then(function () {
                // transition to subset analysis
                Ember.$('.modal.analysis-modal').modal('toggle');
                self.transitionTo('dataset.subset.analysis', self.modelFor('dataset'), parentSubset);
            });
        },

        /**
         *
         * @param {Object} subsetInfo - The subset information parameters.
         */
        createSubset(subsetInfo) {
            let self = this;
            // update method internal state
            let parentSubset = self.modelFor('dataset.subset');
            this.get('store').findRecord('method', subsetInfo.methodId).then(method => {
                // create new subset
                const subset = self.get('store').createRecord('subset', {
                    id: self.get('store').peekAll('subset').get('length'),
                    label: subsetInfo.label,
                    description: subsetInfo.description,
                    resultedIn: method,
                    clusterId: subsetInfo.clusterId
                });
                // set cluster id to send as metadata
                subset.set('clusterId', subsetInfo.clusterId);

                // save the cluster
                subset.save().then(function () {
                    method.save();
                    Ember.$(`#${subsetInfo.modalId}`).modal('toggle');
                    self.transitionTo('dataset.subset', self.modelFor('dataset'), subset.id);
                });
            });
        }
    }

});
