import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed, get, set } from '@ember/object';

export default Component.extend({

    fieldSelection: service('field-selection'),
    store:          service('store'),

    init() {
        this._super(...arguments);
        set(this, 'page', 1);
        set(this, 'limit', 10);
    },

    documentsTable: computed('labelledDocs', 'limit', 'page', function () {
        let limit = this.get('limit');
        let page = this.get('page');
        return this.get('labelledDocs') ?
            this.get('labelledDocs').slice(limit*(page - 1), limit*page).map(obj => obj.document) :
            null;
    }),

    metadata: computed('labelledDocs', 'limit', 'page', function () {
        return {
            fields: this.get('fieldSelection.fields'),
            query: null,
            pagination: {
                page: this.get('page'),
                limit: this.get('limit'),
                documentCount: this.get('labelledDocs.length')
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
            this.get('fieldSelection.fields').forEach(function (field) {
                set(field, 'sortType', null);
                if (get(field, 'name') === fieldParams.field) {
                    set(field, 'sortType', fieldParams.sortType);
                }
            });

            let documents = this.get('labelledDocs').sortBy(`values.${fieldParams.field}`);
            if (fieldParams.sortType === 'desc') {
                documents.reverse();
            }
            this.set('labelledDocs', documents);
         }
    }

});
