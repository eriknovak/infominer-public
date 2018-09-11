import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, get, set } from '@ember/object';
import $ from 'jquery';

export default Component.extend({

    fieldSelection: service('field-selection'),
    store:          service('store'),

    init() {
        this._super(...arguments);
        set(this, 'page', 1);
        set(this, 'limit', 10);
        set(this, 'initializeAL', false);
        set(this, 'documentLabel', []);

        let documentLabel = [ ];
        for (let i = 0; i < this.get('documents.length'); i++) {
            let document = this.get('documents').objectAt(i);
            documentLabel.push({
                document,
                label: 0
            });
        }
        this.set('documentLabel', documentLabel);
    },

    labelledDocuments: computed('documentLabel.@each.label', function () {
        return this.get('documentLabel').filter(obj => obj.label);
    }),

    unlabelledDocuments: computed('documentLabel.@each.label', function () {
        return this.get('documentLabel').filter(obj => !obj.label);
    }),

    positiveLabels: computed('labelledDocuments.@each.label', function () {
        return this.get('labelledDocuments').filter(obj => obj.label === 1).get('length');
    }),

    negativeLabels: computed('labelledDocuments.@each.label', function () {
        return this.get('labelledDocuments').filter(obj => obj.label === -1).get('length');
    }),

    nextDocument: computed('unlabelledDocuments', function () {

        if (this.get('unlabelledDocuments.length')) {
            // save document values
            let document = get(this.get('unlabelledDocuments').objectAt(0), 'document');
            let fields = this.get('dataset.fields');
            let values = [ ];
            // get values in the fields order
            for (let field of fields) {
                let value = get(document, `values.${field.name}`);
                if (value) {
                    // find the selected query value, find and highligh the text
                    if (field.type == 'string_v') {
                        value = value.join(' 🡒 ');
                    } else if (field.type == 'datetime') {
                        value = (new Date(value)).toUTCString();
                    }
                }
                values.push({ value, field: field.name });
            }
             return { document, values };
        } else {
            return null;
        }
    }),

    documentsTable: computed('labelledDocuments', 'limit', 'page', function () {
        let limit = this.get('limit');
        let page = this.get('page');
        return this.get('labelledDocuments') ?
            this.get('labelledDocuments').slice(limit*(page - 1), limit*page).map(obj => obj.document) :
            null;
    }),

    metadata: computed('labelledDocuments', 'limit', 'page', function () {
        return {
            fields: this.get('fieldSelection.fields'),
            query: null,
            pagination: {
                page: this.get('page'),
                limit: this.get('limit'),
                documentCount: this.get('labelledDocuments.length')
            }
        };
    }),


    actions: {
        changeLimit(limit) {
            this.set('limit', limit);
        },
        changePage(page) {
            this.set('page', page);
        },

        sortByField(fieldParams) {
            this.get('dataset.fields').forEach(function (field) {
                set(field, 'sortType', null);
                if (get(field, 'name') === fieldParams.field) {
                    set(field, 'sortType', fieldParams.sortType);
                }
            });

            let documents = this.get('labelledDocuments').sortBy(`values.${fieldParams.field}`);
            if (fieldParams.sortType === 'desc') {
                documents.reverse();
            }
            this.set('labelledDocuments', documents);
         },

         saveLabel(label) {
            let document = this.get('nextDocument.document');
            set(this.get('documentLabel').findBy('document.id', get(document,'id')), 'label', label);

            let pos = this.get('positiveLabels');
            let neg = this.get('negativeLabels');

            if (pos + neg > 5 && pos > 1 && neg > 1 && !this.get('initializedAL')) {
                this.set('documentLabel', this.get('documentLabel').filter(obj => obj.label));
                this.get('documentLabel').pushObject({
                    document: get(this.get('documentLabel').objectAt(0), 'document'),
                    label: 0
                });
                // this.get('store').query('active-learning', { /* TODO */ }).then(response => {
                //     this.get('documentLabel').pushObject({
                //         document: response.document,
                //         label: 0
                //     });
                // });

            } else if (this.get('initializedAL')) {

            }
        }

    },

});
