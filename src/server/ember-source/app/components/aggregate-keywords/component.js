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
        let keywords = distribution.keywords.map(keyword => `${keyword.keyword} (${Math.round(keyword.weight * 100)/100})`).join(', ');
        // sets the values
        this.set('keywords', keywords);
    }
});
