import Component from '@ember/component';
import { inject as service } from '@ember/service';
import $ from 'jquery';

export default Component.extend({

    store: service('store'),

    // component attributes
    classNames: ['modal', 'modal-style--delete'],
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
        this.set('loadingStatus', false);

    },

    didInsertElement() {
        let self = this;
        self._super(...arguments);
        $(`#${self.get('elementId')}`).on('show.bs.modal', function (event) {
            const methodId = $(event.relatedTarget).data('methodid');
            self.set('methodId', methodId);

            // get method information
            const method = self.get('store').peekRecord('method', methodId);
            self.set('label', method.get('label'));
            self.set('appliedOn', method.get('appliedOn.label'));
        });
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {

        delete() {
            const methodId = this.get('methodId');
            if (methodId) {
                this.set('loadingStatus', true);

                this.set('methodId', null);
                this.get('deleteMethod')(methodId).then(() => {
                    // revert loading status
                    this.set('loadingStatus', false);
                    // toggle this modal
                    $(`#${this.elementId}`).modal('toggle');
                });



            }
        }
    }

});
