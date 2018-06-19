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
        this.set('methodId', null);
    },

    didInsertElement() {
        let self = this;
        self._super(...arguments);
        $(`#${self.get('elementId')}`).on('show.bs.modal', function (event) {
            const trigger = $(event.relatedTarget);
            const methodId = trigger.data('methodid');
            self.set('methodId', methodId);
            const method = self.get('store').peekRecord('method', methodId);
            self.set('label', method.get('label'));
            self.set('appliedOn', method.get('appliedOn.label'));
            $(`#${self.get('elementId')} .modal-footer .btn-danger`)
                .html('Yes, delete method');
        });
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {
        
        delete() {
            const methodId = this.get('methodId');
            if (methodId) {
                this.set('methodId', null);
                return this.get('deleteMethod')(methodId);
            }
        }
    }

});
