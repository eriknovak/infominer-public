import Component from '@ember/component';

export default Component.extend({
    classNames: ['checkbox'],

    actions: {
        onClick() { this.get('checkboxAction')(); }
    }
});
