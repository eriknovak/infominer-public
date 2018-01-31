import Component from '@ember/component';
import { observer, get, set } from '@ember/object';
import { once } from '@ember/runloop';

export default Component.extend({
    classNames: ['feature-option-text'],

    // selected parameters
    normalize: true,
    weight: 'tfidf',

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        set(this, 'weightOptions', ['tfidf', 'tf', 'idf', 'none']);
        set(this, 'normalizeOptions', [true, false]);
    },

    didReceiveAttrs() {
        this._super(...arguments);
        this._saveFeatures();
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    _observeFeatureOptions: observer('normalize', 'weight', function () {
        once(this, '_saveFeatures');
    }),

    actions: {
        // sets normalize value
        changeNormalizeValue(index) {
            this.set('normalize', get(this, 'normalizeOptions').objectAt(index));
        },
        // sets weight value
        changeWeightValue(index) {
            this.set('weight', get(this, 'weightOptions').objectAt(index));
        }
    },

    _saveFeatures() {
        this.set('features.normalize', this.get('normalize'));
        this.set('features.weight', this.get('weight'));
    }

});
