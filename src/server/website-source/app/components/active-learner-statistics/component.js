import Component from '@ember/component';

export default Component.extend({
    // component attributes

    didReceiveAttrs() {
        this._super(...arguments);
        if (this.get('statistics.predicted')) {
            // set number of positive examples string
            const allExamples = this.get('statistics.predicted.all');
            const posExamples = this.get('statistics.predicted.positive.count');
            const percentage = (posExamples / allExamples * 100).toFixed(1);
            this.set('number-of-positive-examples', `${posExamples} (${percentage}%)`);

            const posSimilarity = this.get('statistics.predicted.positive.avgSimilarity');
            if (posSimilarity) {
                const textPosSimilarity = (posSimilarity * 100).toFixed(1);
                this.set('similarity-of-positive-examples', textPosSimilarity);
            }
        }
    }

});
