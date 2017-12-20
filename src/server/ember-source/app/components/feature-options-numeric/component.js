import Component from '@ember/component';
import { observer } from '@ember/object';

export default Component.extend({
    classNames: ['feature-option-numeric'],

    // feature options
    normalizeOptions: ['none', 'scale', 'var'],

    // selected parameters
    normalize: 'none',

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didReceiveAttrs() {
        this._super(...arguments);
        this._saveFeatures();
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    _observeFeatureOptions: observer('normalize', function () {
        Ember.run.once(this, '_saveFeatures');
    }),

    actions: {
        // sets normalize value
        changeNormalizeValue(index) {
            this.set('normalize', Ember.get(this, 'normalizeOptions').objectAt(index));
        }
    },

    _saveFeatures() {
        this.set('features.normalize', this.get('normalize'));
    }

});
