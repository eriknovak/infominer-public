import Component from '@ember/component';

export default Component.extend({
    classNames: ['active-learning__actions'],

    didReceiveAttrs() {
        this._super(...arguments);

        // set number of positive examples string
        const isDisabled = !this.get('statistics');
        this.set('isDisabled', isDisabled);
    },

    actions: {
        saveActiveLearning() {
            this.get('saveActiveLearning')();
        }

    }


});
