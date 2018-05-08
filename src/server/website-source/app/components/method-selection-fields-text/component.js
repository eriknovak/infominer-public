import Component from '@ember/component';

export default Component.extend({
    // component attributes
    classNames: ['field-features', 'field-features-text'],

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didReceiveAttrs() {
        this._super(...arguments);
        // set the feature parameters
        let fields = this.get('dataset.fields');
        this.set('parameters.features', fields.filterBy('type', 'string').map(field =>
            ({ field: field.name, included: true })
        ));
    }

});