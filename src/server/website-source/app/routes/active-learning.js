import Route from '@ember/routing/route';
import $ from 'jquery';

export default Route.extend({

    queryParams: {
        queryText: {
          refreshModel: true
        },
        selectedFields: {
            refreshModel: true
        },
        stopwords: {
            refreshModel: true
        }
    },

    model(params) {
        const { dataset_id, subset_id, queryText, selectedFields, stopwords } = params;
        let dataset = this.get('store').peekRecord('dataset', dataset_id);
        let subset  = this.get('store').peekRecord('subset', subset_id);
        const activeLearning = this.get('store').createRecord('active-learning', {
            methodType: 'classify.active-learning',
            appliedOn: subset,
            parameters: {
                initQuery: queryText,
                fields: selectedFields.split(','),
                stopwords: stopwords.split(',')
            }
        });

        return Promise.all([
            dataset, subset, activeLearning.save()
        ]).then(values => ({
            dataset: values[0],
            subset: values[1],
            activeLearning: values[2]
        }));
    },


    actions: {
        /**
         * Deletes the dataset from the user library.
         */
        deleteDataset() {
            // delete dataset and send to backend
            // calls DELETE /api/datasets/:dataset_id
            this.modelFor(this.routeName).dataset.destroyRecord().then(() => {
                // remove modal backdrop and redirect to dataset library
                $('#delete-dataset-modal').modal('toggle');
                this.transitionTo('datasets');
            });
        },

        updateActiveLearning() {
            // save the model
            this.modelFor(this.routeName).activeLearning.save();
        },

        deleteActiveLearning() {
            let { dataset, subset, activeLearning } = this.modelFor(this.routeName);
            activeLearning.destroyRecord();
            this.transitionTo('dataset.subset', dataset, subset);
        },

        saveActiveLearning() {
            let self = this;
            let { dataset, subset, activeLearning } = self.modelFor(self.routeName);
            // create a new method
            const method = self.get('store').createRecord('method', {
                methodType: activeLearning.get('methodType'),
                parameters: {
                    hash: activeLearning.get('id'),
                    initQuery: activeLearning.get('parameters.initQuery'),
                    fields: activeLearning.get('parameters.fields'),
                    stopwords: activeLearning.get('parameters.stopwords')
                },
                appliedOn: subset
            });

            self.modelFor('dataset').get('hasMethods').pushObject(method);
            self.transitionTo('dataset.subset', dataset, subset);
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
                })
                .finally(() => {
                    activeLearning.destroyRecord();
                });

        }

    }
});
