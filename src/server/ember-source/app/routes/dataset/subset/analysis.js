import Route from '@ember/routing/route';

export default Route.extend({

    model() {
        return {
            subset: this.modelFor('dataset.subset'),
            dataset: this.modelFor('dataset')
        };
    },

    actions: {
        startAnalysis(parameters) {
            let self = this;
            // get parent subset - to save method
            let parentSubset = self.currentModel;
            // create a new method
            const method = self.get('store').createRecord('method', {
                id: self.get('store').peekAll('method').get('length'),
                methodType: 'clustering.kmeans',
                parameters: {},
                appliedOn: parentSubset
            });
            self.set('controller.model', parentSubset);
        }

    }


});
