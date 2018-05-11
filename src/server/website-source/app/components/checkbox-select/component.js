import Component from '@ember/component';

export default Component.extend({
    // component attributes
    classNames: ['checkbox'],
    tagName: 'span',

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        // Run checkbox action
        onClick() { 
            this.toggleProperty('checked');
            if (this.get('checkboxAction')) {
                this.get('checkboxAction')();
            } 
        }
    }
});
