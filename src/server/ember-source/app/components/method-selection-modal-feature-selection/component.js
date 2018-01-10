import Component from '@ember/component';

export default Component.extend({
    collapsed: false,

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didReceiveAttrs() {
        this._super(...arguments);
        // set the feature parameters
        let fields = this.get('dataset.fields');
        this.set('parameters.features', fields.map(field =>
            ({ fieldType: field.type, field: field.name, features: { } })
        ));
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        // toggle feature options
        toggleFeatureOptions() {
            this.toggleProperty('collapsed');
        }

    }
});
