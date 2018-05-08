import Component from '@ember/component';
import { observer, get, set } from '@ember/object';
import { once } from '@ember/runloop';

export default Component.extend({
    classNames: ['feature-option-numeric'],

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        set(this, 'normalize', 'none');
        set(this, 'normalizeOptions', ['none', 'scale', 'var']);
    },

    didReceiveAttrs() {
        this._super(...arguments);
        this._saveFeatures();
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    _observeFeatureOptions: observer('normalize', function () {
        once(this, '_saveFeatures');
    }),

    actions: {
        // sets normalize value
        changeNormalizeValue(index) {
            this.set('normalize', get(this, 'normalizeOptions').objectAt(index));
        }
    },

    _saveFeatures() {
        this.set('features.normalize', this.get('normalize'));
    }

});
