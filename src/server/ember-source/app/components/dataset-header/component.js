import Component from '@ember/component';

export default Component.extend({

    didReceiveAttrs() {
        this._super(...arguments);
        // modify date to appropriate format
        this._prepareDate();
    },


    ///////////////////////////////////
    // helper functions

    /**
     * Change date to dd/mm/YYYY format.
     */
    _prepareDate() {
        const c = this.get('dataset.created');
        let date = `${c.getDate()}/${c.getMonth() + 1}/${c.getFullYear()}`;
        this.set('dataset.date', date);
    }

});
