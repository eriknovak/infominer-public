import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
    // component attributes
    classNames: ['modal', 'fade'],
    attributeBindings: ['tabindex', 'role'],
    tagName: 'div',
    tabindex: -1,
    role: 'dialog',

    didReceiveAttrs() {
        this._super(...arguments);

        this.set('page', 1);
        this.set('limit', 5);
    },

    documents: computed('cluster.documentSample', 'limit', 'page', function () {
        let limit = this.get('limit');
        let page = this.get('page');
        return this.get('cluster.documentSample') ?
            this.get('cluster.documentSample').slice(limit*(page - 1), limit*page) :
            null;
    }),

    metadata: computed('cluster.documentSample', 'limit', 'page', function () {
        return {
            fields: this.get('dataset.fields'),
            query: null,
            pagination: {
                page: this.get('page'),
                limit: this.get('limit'),
                documentCount: this.get('cluster.documentSample.length')
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
        sortByField() { }

    }

});
