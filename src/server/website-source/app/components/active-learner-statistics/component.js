import Component from '@ember/component';

export default Component.extend({
    // component attributes
    classNames: ['analysis'],

    didReceiveAttrs() {
        this._super(...arguments);

        // set number of positive examples string
        const allExamples = this.get('statistics.predicted.all');
        const posExamples = this.get('statistics.predicted.positive.count');
        const percentage = (posExamples / allExamples * 100).toFixed(1);
        this.set('examples-string', `${posExamples} (${percentage}%)`);
    }

});
