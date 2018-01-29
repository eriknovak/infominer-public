import Component from '@ember/component';

export default Component.extend({
    // component attributes
    classNames: ['table', 'table-hover'],
    tagName: 'table',

    didReceiveAttrs() {
        this._super(...arguments);
        this.set('loading-row-width', 1 + this.get('fields.length'));
    }

});
