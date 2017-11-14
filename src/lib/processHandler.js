// creating child processes
const { fork } = require('child_process');

/**
 * Child process instance.
 * @typedef child_object
 * @type {Object}
 * @property {String} creator - The creator of the child process.
 * @property {String} label - The dataset label.
 * @property {String} dbPath - The dataset directory.
 * @property {Object} child - The forked child process.
 */

/**
 * Handles child processes.
 */
class ProcessHandler {

    /**
     * Creates a new instance of the ProcessHandler.
     * @constructor
     */
    constructor() {
        /**
         * Array of child processes.
         * @type {child_object[]}
         */
        this._children = [ ];
    }

    /**
     * Closes every child process gracefully.
     */
    close() {
        this._children.forEach((cProcess) => {
            console.log('Disconnecting with', cProcess.child.pid);
            cProcess.child.disconnect();
        });
    }

    /**
     * Forks a new child process.
     * @param {String} processPath - The directory of the process.
     * @param {Object} metadata - The metadata associated with the child process.
     * @param {String} metadata.creator - The creator of the child process.
     * @param {String} metadata.label - The dataset label.
     * @param {String} metadata.dbPath - The dataset directory.
     * @returns {child_object} The child process object and metadata.
     */
    fork(processPath, metadata) {
        // create a new child process
        let child = fork(processPath);
        // store the child in the metadata
        metadata.child = child;
        // push the metadata into the container
        return this._push(metadata);
    }

    /**
     * Pushes a new child process to the array.
     * @param {child_object} childObject - The child process and metadata.
     * @returns {child_object} The childObject instance.
     */
    _push(childObject) {
        //TODO: check if child schema is correct
        this._children.push(childObject);
        return childObject;
    }

    /**
     * Gets child process matching the conditions.
     * @param {Object} conditions - Conditions used in search.
     * @param {String} [conditions.creator] - The creator of the child process.
     * @param {String} [conditions.label] - The label of the dataset within the child process.
     * @param {String} [conditions.dbPath] - The database directory.
     * @returns {child_object} The object matching the conditions.
     */
    getChild(conditions) {
        // TODO: implement the search function
    }

}

module.exports = ProcessHandler;