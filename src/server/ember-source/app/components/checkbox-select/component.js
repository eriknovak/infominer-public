import Component from '@ember/component';

export default Component.extend({
    // component attributes
    classNames: ['checkbox'],

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        /**
         * Run checkbox action.
         */
        onClick() { this.get('checkboxAction')(); }
    }
});
