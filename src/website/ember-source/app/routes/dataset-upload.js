import Route from '@ember/routing/route';
import { task } from 'ember-concurrency';

const { get, set } = Ember;

export default Route.extend({

    model() {
        // the initial model is null
        return null;
    },

    actions: {
        readDataset(file) {
            this.readDataset(file);
        },
        resetModel() {
            set(this, 'controller.model', null);
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
        let name = get(file, 'name').split('.')[0]; // get file name without extansion
        let size = get(file, 'size');
        let numDocs = tableRows.length - 1;
        // set model of this route
        set(self, 'controller.model', { file: { name, size, numDocs }, fieldValues });
        file.upload('http://localhost:3000/api/dataset/new');
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

