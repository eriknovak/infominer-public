import Component from '@ember/component';

export default Component.extend({
    tagName: 'tr',

    didReceiveAttrs() {
        this._super(...arguments);
        // get document valueObject and fields
        const valueObject = this.get('valueObject');
        const fields = this.get('fields');

        let values = [ ];
        // get values in the fields order
        for (let field of fields) {
            // console.log(field);
            values.push(valueObject[field.name]);
        }
        // save values
        this.set('values', values);
    }

});
