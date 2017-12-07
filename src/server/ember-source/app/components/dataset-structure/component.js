import Component from '@ember/component';

export default Component.extend({

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didReceiveAttrs() {
        this._super(...arguments);
        const dataset = this.get('dataset');
        this.set('root', dataset.get('hasSubsets').get('firstObject'));
    }

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

});
