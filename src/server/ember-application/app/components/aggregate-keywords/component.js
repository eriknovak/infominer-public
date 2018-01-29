import Component from '@ember/component';

export default Component.extend({
    // component attributes
    classNames: ['aggregate', 'aggregate-keywords'],

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didReceiveAttrs() {
        this._super(...arguments);
        let distribution = this.get('distribution');
        // get keywords and their tf-idf values
        let keywords = distribution.keywords;
        // sets the values
        this.set('keywords', keywords);
    }
});
