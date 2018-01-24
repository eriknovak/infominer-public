const async = require('async');
// creating child processes
const { fork } = require('child_process');

// TODO: logging process activity

/**
 * The child process container and handler.
 */
class ProcessHandler {

    /**
     * Child process instance.
     * @typedef child_object
     * @type {Object}
     * @property {Number} id - Postgresql dataset id.
     * @property {Object} child - The forked child process.
     * @property {Boolean} connected - If the child is connected with the parent process.
     */

    /**
     * Initializes the process handler.
     * @param {Object} params - The process handler parameters.
     * @param {String} processPath - The path to the child process.
     */
    constructor(params) {
        let self = this;

        self._currReqId = 0;
        self._childH = new Map();
        self._callbackH = new Map();
        self._processPath = params.processPath;

        // child monitoring parameters
        self._processMaxAge = params.processMaxAge;

        // Set the cleanup interval. Default: 1 hours
        let cleanupInterval = params.cleanupMilliseconds || 60*60*1000;

        self._cleanupInterval = setInterval(function () {
            self._cleanupProcess();
        }, cleanupInterval);
    }

    /**
     * Initializes the child process.
     * @param {Number} childId - The id of the child process. Used for
     * further reference to the child process.
     * TODO: log activity
     */
    createChild(childId) {
        let self = this;
        let child = fork(self._processPath, [], { silent: false });
        self._childH.set(childId, { child, connected: true, lastCall: 0 });

        child.on('message', function (msg) {
            let reqId = msg.reqId;
            let callbackH = self._callbackH.get(reqId);
            if (callbackH) {
                // callback exists
                let callback = callbackH.callback;
                let error = msg.error ? new Error(msg.error) : undefined;
                // envoke the callback
                callback(error, msg.results);
                // delete the callback hash
                self._callbackH.delete(reqId);
            } else {
                // no callback was given for this request
                console.log(msg);
            }
        });

        child.on('exit', function () {
            self._childH.delete(childId);
        });
    }

    /**
     * Checks if the child process exists.
     * @param {Number} childId - Id reference to the child process.
     * @returns {Boolean} True if process exists. Otherwise, false.
     */
    childExist(childId) {
        let self = this;
        return self._getChild(childId) ? true : false;
    }

    /**
     * Get the child process if exists.
     * @param {Number} childId - The process reference id.
     * @param {}
     */
    _getChild(childId) {
        let self = this;
        return self._childH.get(childId);
    }

    _updateProcessLastCall(childId, childProcess) {
        let self = this;
        // get process timestamp info
        childProcess.lastCall = Date.now();
        self._childH.set(childId, childProcess);
    }

    /**
     * Sends the message to the child process. No response is requested.
     * TODO: log activity
     * @param {Number} childId - The reference process id.
     * @param {Object} params - Message body.
     */
    send(childId, params) {
        let self = this;
        let childH = self._getChild(childId);
        if (!childH) { return new Error('Child process not running!'); }
        // update child process
        self._updateProcessLastCall(childId, childH);
        // prepare message
        let msg = {
            reqId: -1,
            body: params
        };
        // if child is connected
        if (childH.connected) {
            childH.child.send(msg);
        } else {
            // TODO: handle not connected childs
        }
    }
    /**
     * Sends the message to the child process. Response is requested.
     * TODO: log activity
     * @param {Number} childId - The reference process id.
     * @param {Object} params - Message body.
     * @param {Function} callback - The callback funtion. What to do with the response.
     */
    sendAndWait(childId, params, callback) {
        let self = this;
        let childH = self._getChild(childId);
        if (!childH) { callback(new Error('Child process not existing!')); }
        // update child process
        self._updateProcessLastCall(childId, childH);
        // store callback
        self._callbackH.set(self._currReqId, {
            timestamp: Date.now(),
            callback: callback
        });
        // prepare message
        let msg = {
            reqId: self._currReqId++,
            body: params
        };
        if (childH.connected) {
            // if child is connected
            childH.child.send(msg);
        } else {
            // TODO: handle not connected childs
            callback(new Error('Child is disconnected!'));
        }
        // TODO: handle request cleanup
        if (self._currReqId % 100) {
            self._cleanReqMap();
        }
    }

    /**
     * Cleans the request mapping.
     * @private
     * TODO: log activity
     */
    _cleanReqMap() {
        let self = this;

        // the maximum duration of the callback
        let maxDuration = 2*60*1000;

        for (let key of self._callbackH.keys()) {
            let now = Date.now();
            // check if callback is `maxDuration` old
            if (now - self._callbackH.get(key).timestamp > maxDuration) {
                let callback = self._callbackH.get(key).callback;
                self._callbackH.delete(key);
                callback(new Error('Request timed out!'));
            }
        }
    }

    _cleanupProcess() {
        let self = this;

        /**
         * Creates the callback function for cleanup.
         * @param {Object} error - The error object.
         * @returns {Function} The callback functions.
         */
        function _setCallback(key) {
            return function (error) {
                if (error) { console.log('Disconnected with error'); }
                console.log('process shutdown', key);
            };
        }

        // iterate through processes and close old processes
        for (let key of self._childH.keys()) {
            let now = Date.now();
            if (now - self._childH.get(key).lastCall > self._processMaxAge) {
                // send to process to shutdown
                // this will also remove the child from the hash
                self.sendAndWait(key, { cmd: 'shutdown' }, _setCallback(key));
            }
        }
    }

    /**
     * Closes all processes.
     * TODO: log activity
     * @param {Function} callback - The function called at the end of the process.
     */
    closeAllProcesses(callback) {
        let self = this;
        let tasks = [ ];
        for (let key of self._childH.keys()) {
            tasks.push(self._stopProcessCallback(key));
        }
        // run the closing tasks
        async.series(tasks, callback);
    }

    /**
     * Creates a callback function to close the process.
     * @param {String} childId - The id of the child process.
     * @returns {Function} The callback function.
     * @private
     */
    _stopProcessCallback(childId) {
        let self = this;
        return function (xcallback) {
            console.log('Running task for child id=', childId);
            try {
                self.sendAndWait(childId, { cmd: 'shutdown' }, (error) => {
                    if (error) { console.log('Disconnected with error'); }
                    xcallback();
                });
            } catch (err) {
                console.log('Child already closed');
                xcallback();
            }
        };
    }
}

// exports the process handler
module.exports = ProcessHandler;
