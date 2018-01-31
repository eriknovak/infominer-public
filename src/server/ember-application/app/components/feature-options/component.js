import Component from '@ember/component';
import { observer, get, set } from '@ember/object';
import { once } from '@ember/runloop';

export default Component.extend({
    // component attributes
    classNames: ['field-features'],

    // selected parameters
    included: true,

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        // set the feature options
        this.set('featureOptions', [
            { type: 'text', selected: false },
            { type: 'numeric', selected: false }
        ]);
    },

    didReceiveAttrs() {
        this._super(...arguments);
        // TODO: field type determines what is the default feature option
        let fieldType = this.get('features.fieldType');
        // get the feature option depending on the field type
        let option = fieldType === 'string' ?
            this.get('featureOptions').objectAt(0):
            this.get('featureOptions').objectAt(1);
        // set the option default value
        set(option, 'selected', true);
        // set the selected feature parameter
        this.set('selectedFeatureOption', get(option, 'type'));
        // save the feature options
        this._saveFeatureOptions();
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    // observes the feature changes for that field
    _observeFeatureChanges: observer('included', 'selectedFeatureOption', function () {
        once(this, '_saveFeatureOptions');
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
