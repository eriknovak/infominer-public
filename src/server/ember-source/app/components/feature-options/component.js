import Component from '@ember/component';
import { observer } from '@ember/object';

export default Component.extend({
    // component attributes
    classNames: ['field-features'],

    // parameter options
    featureOptions: ['text', 'numeric'],

    // selected parameters
    selectedFeatureOption: 'text',
    included: true,

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didReceiveAttrs() {
        this._super(...arguments);
        // TODO: field type determines what is the default feature option

        this._saveFeatureOptions();
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    // observes the feature changes for that field
    _observeFeatureChanges: observer('included', 'selectedFeatureOption', function () {
        Ember.run.once(this, '_saveFeatureOptions');
    }),

    actions: {
        // sets the feature type
        changeFeaturesType(selectedFeatureOption) {
            this.set('selectedFeatureOption', selectedFeatureOption);
            // features were changed - new parameters needs to be set
            this.set('features.features', { });
        },

        // toggle feature inclusion
        toggleFeatureInclusion() {
            this.toggleProperty('included');
        }
    },

    // saves the features
    _saveFeatureOptions() {
        this.set('features.included', this.get('included'));
        this.set('features.features.field', this.get('features.field'));
        this.set('features.features.type', this.get('selectedFeatureOption'));
    }
});
