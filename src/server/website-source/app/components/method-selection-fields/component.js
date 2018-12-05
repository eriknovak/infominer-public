import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didReceiveAttrs() {
        this._super(...arguments);
        // set the feature parameters
        let fields = this.get('dataset.fields');
        let type = this.get('type.type');
        this.set('parameters.features', fields.filterBy('type', type).map(field =>
            ({ field: field.name, included: true })
        ));
    },

    areStringFeatures: computed('type.type', function () {
        return this.get('type.type') === 'string';
    })

});
