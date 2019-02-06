import DS from 'ember-data';

export default DS.RESTSerializer.extend({

    serialize(record, options) {
        let json = this._super(record, options);
        // id and appliedOn should be integers

        json.id = parseInt(record.id);
        json.subsets = json.subsets.map(id => parseInt(id));
        // return fixed results
        return json;
    }
});
