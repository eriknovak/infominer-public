import DS from 'ember-data';

export default DS.RESTSerializer.extend({

    serialize() {
        let json = this._super(...arguments);

        // id and appliedOn should be integers
        json.id = parseInt(json.id);
        json.resultedIn = parseInt(json.resultedIn);
        // if description is not given - set to null
        json.description = json.description.length > 0 ? json.description : null;
        // modify document ids
        json.documents = json.documents.map(id => parseInt(id));
        // return fixed results
        return json;
    }
});
