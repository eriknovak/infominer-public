import Component from '@ember/component';

export default Component.extend({
    // component attributes
    classNames: ['aggregate', 'aggregate-count'],

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didReceiveAttrs() {
        this._super(...arguments);
        let distribution = this.get('distribution');
        // get keywords and their tf-idf values
        let bubblechart = distribution.values;
        // sets the values
        this.set('bubblechart', bubblechart);
    }
});
