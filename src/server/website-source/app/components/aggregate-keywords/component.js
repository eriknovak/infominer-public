import Component from '@ember/component';

export default Component.extend({
    // component attributes
    classNames: ['aggregate', 'aggregate-keywords'],

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didReceiveAttrs() {
        this._super(...arguments);
        // get keywords and their tf-idf values
        let distribution = this.get('distribution');
        this.set('keywords', distribution.keywords);
    }
});
