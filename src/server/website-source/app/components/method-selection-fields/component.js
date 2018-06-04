import Component from '@ember/component';

export default Component.extend({
    // component attributes
    classNames: ['field-features'],

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
    }

});
