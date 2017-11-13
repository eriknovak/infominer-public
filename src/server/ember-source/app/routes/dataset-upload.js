import Route from '@ember/routing/route';
import ENV from 'ember-source/config/environment';

export default Route.extend({
    uploader: Ember.inject.service('file-queue'),

    model() {
        this.resetQueue();
        // the initial model is null
        return null;
    },

    actions: {
        /**
         * Reads dataset and extracts the fields.
         * @param {Object} file - The file blob.
         */
        readDataset(file) {
            // save route object
            // TODO: handle reading with buffers
            file.readAsText().then((data) => {
                this.extractFields(file, data);
            });
        },

        /**
         * Resets model and file queue.
         */
        resetModel() {
            this.resetQueue();
            // reset the model
            this.set('controller.model', null);
        },

        /**
         * Pushes metadata and file blob to server.
         * @param {Object} file - File blob.
         */
        submitDataset(file) {
            // get route model values
            let { dataset, fieldList } = this.get('controller.model');
            // filter out the included fields and prepare the array as
            //let fields = fieldList.map(field => ({ name: field.name, type: field.type, in }));

            // set the options and upload
            file.upload({
                url: `${ENV.APP.HOSTNAME}/api/dataset/new`,
                data: {
                    dataset: JSON.stringify(dataset),
                    fields: JSON.stringify(fieldList)
                }
            });
        }
    },

    // helper functions

    /**
     * Extracts fields, types and update the route model.
     * @param {String} file - The file blob object.
     * @param {String} data - The file/data containing the table.
     */
    extractFields: function (file, data) {
        // separate rows and take first row as field names
        const tableRows = data.split(/\r\n?|\n/g);
        const fields = tableRows[0].split('|');

        // TODO: set field type recommendation
        let fieldList = fields.map(field => ({ name: field, type: 'string', included: true }));

        // get dataset name, size and number of documents
        let name = file.get('name').split('.')[0];
        let size = file.get('size');
        let numDocs = tableRows.length - 1;
        // set model of this route
        this.set('controller.model', { file, dataset: { name, size, numDocs }, fieldList });
    },

    /**
     * Resets file queue.
     */
    resetQueue: function () {
        // get the dataset queue and set them all to null
        const uploader = this.get('uploader');
        let queue = uploader.find("dataset");
        if (queue) {
            queue.get('files').forEach((file) => file.set('queue', null));
            queue.set('files', Ember.A());
        }
    }

});

