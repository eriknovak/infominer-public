import Component from '@ember/component';

export default Component.extend({
    // component attributes
    classNames: ['pull-right'],

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        emptyWarningContainer() {
            // get warning container
            let warningContent = Ember.$('#create-subset-documents-modal div.warning');
            // empty warning container
            warningContent.empty();
        }
    }

});
