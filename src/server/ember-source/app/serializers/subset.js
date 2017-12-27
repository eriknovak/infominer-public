import DS from 'ember-data';

export default DS.RESTSerializer.extend({

    serialize(record, options) {
        let json = this._super(record, options);
        // id and appliedOn should be integers
        json.id = parseInt(json.id);
        json.resultedIn = parseInt(json.resultedIn);
        // if description is not given - set to null
        json.description = json.description.length > 0 ? json.description : null;
        // modify document ids
        if (json.documents) { json.documents = json.documents.map(id => parseInt(id)); }

        // set metadata
        let clusterId = record.record.clusterId;
        json.meta = { clusterId };

        // return fixed results
        return json;
    }
});
