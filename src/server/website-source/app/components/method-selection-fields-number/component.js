import Component from '@ember/component';

export default Component.extend({
    // component attributes
    classNames: ['field-features', 'field-features-numeric'],

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didReceiveAttrs() {
        this._super(...arguments);
        // set the feature parameters
        let fields = this.get('dataset.fields');
        console.log(fields);
        this.set('parameters.features', fields.filterBy('type', 'float').map(field =>
            ({ field: field.name, included: true })
        ));
    }

});
