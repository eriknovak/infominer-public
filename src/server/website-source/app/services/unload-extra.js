import Service from '@ember/service';

export default Service.extend({

    /**
     * Sets the columnWidth to each of the component.
     * @param {Object} response - The dataset response.
     */
    unload(response, store, modelType='method') {
        // set relationship name
        let relationship = modelType === 'method' ? 'hasMethods' : 'hasSubsets';
        let storeRecords = store.peekAll(modelType);
        let dbRecords = response.get(relationship);

        for (let i = 0; i < storeRecords.get('length'); i++) {
            let sRecord = storeRecords.objectAt(i),
                exists = false;
            // iterate through responses
            for (let j = 0; j < dbRecords.get('length'); j++) {
                const dbRecord = dbRecords.objectAt(j);
                if (sRecord.get('id') === dbRecord.get('id')) {
                    exists = true;
                    break;
                }
            }
            if (!exists) { sRecord.unloadRecord(); }
        }
    }

});
