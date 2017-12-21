import Route from '@ember/routing/route';

export default Route.extend({

    model() {
        let subset = this.modelFor('dataset.subset');
        let dataset = this.modelFor('dataset');
        return { subset, dataset };
    },

    actions: {
        startAnalysis(analysisParams) {
            let self = this;
            // get parent subset - to save method
            let parentSubset = self.currentModel.subset;
            // create a new method
            const method = self.get('store').createRecord('method', {
                id: self.get('store').peekAll('method').get('length'),
                methodType: analysisParams.methodType,
                parameters: analysisParams.parameters,
                appliedOn: parentSubset
            });
            method.save();
            // transition to subset analysis
            Ember.$('.modal.analysis-modal').modal('toggle');
            self.transitionTo('dataset.subset.analysis', self.modelFor('dataset'), parentSubset.id);
        }

    }

});
