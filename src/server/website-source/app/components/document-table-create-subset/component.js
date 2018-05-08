import Component from '@ember/component';
import $ from 'jquery';

export default Component.extend({
    // component attributes
    classNames: ['pull-right'],

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        emptyWarningContainer() {
            // get warning container
            let warningContent = $('#create-subset-documents-modal div.warning');
            // empty warning container
            warningContent.empty();
        }
    }

});
