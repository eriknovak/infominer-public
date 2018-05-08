import Component from '@ember/component';

export default Component.extend({
    // component attributes
    classNames: ['col-xs-6', 'col-sm-4', 'col-lg-2'],


    didReceiveAttrs() {
        this._super(...arguments);
        let created = this.get('dataset.created');
        let date = `${created.getDate()}/${created.getMonth() + 1}/${created.getFullYear()}`;
        this.set('dataset.date', date);
    }
});
