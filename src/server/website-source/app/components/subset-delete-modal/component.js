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
        this.set('subsetId', null);
        this.set('loadingStatus', false);
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
        });
    },

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

    actions: {

        delete() {
            const subsetId = this.get('subsetId');
            if (subsetId) {
                // set loading status to true
                this.set('loadingStatus', true);
                this.set('subsetId', null);
                this.get('deleteSubset')(subsetId).then(() => {
                    // revert loading status
                    this.set('loadingStatus', false);
                    // toggle this modal
                    $(`#${this.elementId}`).modal('toggle');
                });

            }
        }
    }

});
