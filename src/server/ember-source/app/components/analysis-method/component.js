import Component from '@ember/component';

export default Component.extend({
    // component attributes
    classNames: ['row', 'analysis'],

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didReceiveAttrs() {
        this._super(...arguments);
        // get type of the method
        let type = this.get('type');

        // prepare component name based on the type
        let methodComponent = `analysis-method-${type.replace(/\./g, '-')}`;
        this.set('methodComponent', methodComponent);
    }

});
