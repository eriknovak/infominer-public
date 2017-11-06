import Route from '@ember/routing/route';
import { task } from 'ember-concurrency';

const { get, set } = Ember;

export default Route.extend({

    model() {
        return { filename: null, fieldValues: null }
    },

    actions: {
        readDataset(file) {
            this.readDataset(file);
        }
    },

    /**
     * Extracts fields and it's types.
     * @param {String} data - The file/data containing the table.
     */
    extractFields: function (file, data) {
        const self = this;
        let tableRows = data.split(/\n/g);
        const fields = tableRows[0].split('|');

        // TODO: set field recommendation

        let fieldValues = fields.map(field => ({ field, type: 'string' }));
        let filename = get(file, 'name');
        // set model of this route
        set(self, 'controller.model', { filename, fieldValues });
        file.upload('/');
    },

    /**
     * Reads dataset for field extraction.
     */
    readDataset: function (file) {
        // save route object
        file.readAsText().then((data) => {
            this.extractFields(file, data);
        });
      }
});

