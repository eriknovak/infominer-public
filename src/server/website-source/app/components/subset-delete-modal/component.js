import Component from '@ember/component';
import { inject as service } from '@ember/service';
import $ from 'jquery';

export default Component.extend({

    store: service('store'),

    // component attributes
    classNames: ['modal'],
    attributeBindings: ['tabindex', 'role', 'backdrop:data-backdrop'],
    tagName: 'div',
    tabindex: -1,
    role: 'dialog',
    backdrop: 'static',

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        this.set('subsetId', null);
    },

    didInsertElement() {
        let self = this;
        self._super(...arguments);
        $(`#${self.get('elementId')}`).on('show.bs.modal', function (event) {
            const trigger = $(event.relatedTarget);
            const subsetId = trigger.data('subsetid');
            self.set('subsetId', subsetId);
            const subset = self.get('store').peekRecord('subset', subsetId);
            self.set('subsetLabel', subset.get('label'));
            self.set('derivedFrom', subset.get('resultedIn.appliedOn.label'));
            self.set('createdUsing', subset.get('resultedIn.label'));
            $(`#${self.get('elementId')} .modal-footer .btn-danger`)
                .html('Yes, delete subset');
        });
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {

        delete() {
            const subsetId = this.get('subsetId');
            if (subsetId) {
                this.set('subsetId', null);
                return this.get('deleteSubset')(subsetId);
            }
        }
    }

});
