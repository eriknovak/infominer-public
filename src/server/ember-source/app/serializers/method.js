import DS from 'ember-data';

export default DS.RESTSerializer.extend({

    serialize() {
        let json = this._super(...arguments);

        // id and appliedOn should be integers
        json.id = parseInt(json.id);
        json.appliedOn = parseInt(json.appliedOn);
        // return fixed results
        return json;
    }
});
