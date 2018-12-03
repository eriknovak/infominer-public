import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, get, set } from '@ember/object';
import $ from 'jquery';

export default Component.extend({
    classNames: ['overview'],

    fieldSelection: service('field-selection'),
    columnWidth: service('column-size'),
    store:       service('store'),

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    init() {
        this._super(...arguments);
        set(this, 'editing-label', false);
        set(this, 'collapsed', false);
    },

    didReceiveAttrs() {
        this._super(...arguments);
        let classExample = this.get('class');
        this.set('label', this.get('store').peekRecord('subset', classExample.subset.id).get('label'));
    },

    didInsertElement() {
        let self = this;
        self._super(...arguments);
        const elementId = self.get('elementId');
        // on hover show edit button
        $(`#${elementId} .overview__title`).hover(
          function () { $(`#${elementId} .overview__title--edit`).addClass('show'); },
          function () { $(`#${elementId} .overview__title--edit`).removeClass('show'); }
        );
    },

    didRender() {
        let self = this;
        self._super(...arguments);
        if (self.get('editing-label')) {
            // save cluster label change on enter
            $(`#${self.get('elementId')} input.editing`).on('keyup', function (e) {
                if (e.keyCode == 13) { self._saveLabel(); }
            });
        }
    },

    aggregates: computed('fieldSelection.fields.@each.showInVisual', 'class.aggregates', function () {
        // set column width for medium and large view size
        // TODO: remove filter
        let aggregates = this.get('class.aggregates').filter(aggregate =>
            this.get('fieldSelection').isShownInVisual(aggregate.field)
        );
        this.get('columnWidth.setColumnsWidth')(aggregates, 3, 'lg');
        this.get('columnWidth.setColumnsWidth')(aggregates, 2, 'sm');
        // get subset names
        return aggregates;
    }),


    actions: {
        toggleInformation() { this.toggleProperty('collapsed'); },
        editLabel() { this.toggleProperty('editing-label'); },
        saveLabel() { this._saveLabel(); },
    },

    _saveLabel() {
        const elementId = this.get('elementId');
        const label = $(`#${elementId} input.editing`).val();

        // save the label of the subset
        let subset = this.get('store').peekRecord('subset', this.get('class').subset.id);
        subset.set('label', label); subset.save();

        // save the label of the cluster
        this.set('label', subset.get('label'));
        this.toggleProperty('editing-label');
    }

});
