import Component from '@ember/component';
import { observer } from '@ember/object';

export default Component.extend({
    classNames: ['feature-option-text'],

    // feature options
    weightOptions: ['tfidf', 'tf', 'idf', 'none'],
    normalizeOptions: [true, false],

    // selected parameters
    normalize: true,
    weight: 'tfidf',

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

    _observeFeatureOptions: observer('normalize', 'weight', function () {
        Ember.run.once(this, '_saveFeatures');
    }),

    actions: {
        // sets normalize value
        changeNormalizeValue(index) {
            this.set('normalize', Ember.get(this, 'normalizeOptions').objectAt(index));
        },
        // sets weight value
        changeWeightValue(index) {
            this.set('weight', Ember.get(this, 'weightOptions').objectAt(index));
        }
    },

    _saveFeatures() {
        this.set('features.normalize', this.get('normalize'));
        this.set('features.weight', this.get('weight'));
    }

});
