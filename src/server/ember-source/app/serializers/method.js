import DS from 'ember-data';

export default DS.RESTSerializer.extend({

    serialize(record, options) {
        let json = this._super(record, options);
        // id and appliedOn should be integers
        json.id = parseInt(record.id);
        json.appliedOn = parseInt(json.appliedOn);
        // return fixed results
        return json;
    }
});
