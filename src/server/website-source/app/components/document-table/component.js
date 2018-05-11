import Component from '@ember/component';

export default Component.extend({

    ///////////////////////////////////////////////////////
    // Component Life Cycle
    ///////////////////////////////////////////////////////

    didReceiveAttrs() {
        this._super(...arguments);
        const model = this.get('model');
        // set documents, fields and pagination values
        this.set('documents', model);
        this.set('fields', model.get('meta.fields'));
        this.set('pagination', model.get('meta.pagination'));
        this.set('query', model.get('meta.query'));
    }

    ///////////////////////////////////////////////////////
    // Actions
    ///////////////////////////////////////////////////////

});
