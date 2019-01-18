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
         * @param {Object} params - Parameters for the analysis.
         */
        startAnalysis(params) {
            let self = this;
            // toggle the modal - giving the user control
            $('.modal.modal-style--analysis').modal('toggle');
            // get parent subset - to save method
            let parentSubset = self.modelFor('dataset.subset');
            // create a new method
            const method = self.get('store').createRecord('method', {
                methodType: params.methodType,
                parameters: params.parameters,
                appliedOn: parentSubset
            });
            self.modelFor('dataset').get('hasMethods').pushObject(method);
            // save the method
            method.save()
                .then(method => method.get('produced'))
                .then(_subsets => {
                    _subsets.forEach(_subset => {
                        self.modelFor('dataset').get('hasSubsets').pushObject(_subset);
                        _subset.get('usedBy').then(_methods => {
                            _methods.forEach(_method => {
                                self.modelFor('dataset').get('hasMethods').pushObject(_method);
                            });
                        });
                    });
                });
        },

        startActiveLearning(params) {
            // toggle the modal - giving the user control
            $('.modal.modal-style--analysis').modal('toggle');
            let model = this.modelFor(this.routeName);
            this.transitionTo('active-learning', model.dataset.id, model.subset.id, {
                queryParams: params
            });
        },

        /**
         * Creates a subset and stores it on the backend.
         * @param {Object} params - The subset information parameters.
         */
        createSubset(params) {
            let self = this;
            // update method internal state
            self.get('store').findRecord('method', params.parameters.methodId).then(method => {
                // create new subset
                const subset = self.get('store').createRecord('subset', {
                    label: params.label,
                    description: params.description,
                    resultedIn: method,
                    clusterId: params.parameters.clusterId,
                    documentCount: params.parameters.documentCount
                });
                // needed to correctly increment subset and method indices
                self.modelFor('dataset').get('hasSubsets').pushObject(subset);

                subset.save()
                    .then(subset => subset.get('usedBy'))
                    .then(methods => {
                        methods.forEach(method => {
                            self.modelFor('dataset').get('hasMethods').pushObject(method);
                        });
                    });
                self.transitionTo('dataset.subset', subset);
            }).finally(() => {
                // toggle the modal - giving the user control
                $('#subset-create-modal').modal('toggle');
            });
        }
    }

});
