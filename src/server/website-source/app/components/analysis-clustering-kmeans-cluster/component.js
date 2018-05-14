import Component from '@ember/component';
import { set } from '@ember/object';

export default Component.extend({
    classNames: ['cluster-content'],

    init() {
        this._super(...arguments);
        set(this, 'collapsed', false);
        set(this, 'editing-cluster-label', false);
    },

    didInsertElement() {
        this._super(...arguments);
        const elementId = this.get('elementId');
        $(`#${elementId} .cluster-header`).hover(
          function () { $(`#${elementId} .edit-cluster-label`).addClass('show'); },
          function () { $(`#${elementId} .edit-cluster-label`).removeClass('show'); }  
        );
    },

    actions: {
        toggleInformation() { this.toggleProperty('collapsed'); },
        editClusterLabel() {
            this.toggleProperty('editing-cluster-label');
        }
    }
});
