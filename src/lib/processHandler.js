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
    }

    /**
     * Initializes the child process.
     * TODO: log activity
     * @param {Number} childId - The id of the child process. Used for further reference to the child process.
     */
    createChild(childId) {
        let self = this;
        let child = fork(self._processPath, [], { silent: false });
        self._childH.set(childId, { child, connected: true });

        child.on('message', function (msg) {
            let reqId = msg.reqId;
            let callbackH = self._callbackH.get(reqId);
            if (callbackH) {
                // callback exists
                let callback = callbackH.callback;
                let error = msg.error ? new Error(msg.error) : undefined;
                callback(error, msg.content);
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
        // TODO bolj pametno
        if (self._currReqId % 100) {
            self._cleanReqMap();
        }
    }

    /**
     * Cleans the request mapping.
     * TODO: log activity
     */
    _cleanReqMap() {
        let self = this;
        for (let key in self._callbackH.keys()) {
            let now = Date.now();
            if (now - self._callbackH.get(key).timestamp > 1000*30) {
                let callback = self._callbackH[key].callback;
                self._callbackH.delete(key);
                callback(new Error('Request timed out!'));
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
            tasks.push((xcallback) => {
                console.log('Running task for child id=', key);
                try {
                    self.sendAndWait(key, { cmd: 'shutdown' }, (error, content) => {
                        if (error) {
                            console.log('Disconnected with error');
                        }
                        xcallback();
                    });
                } catch (err) {
                    console.log('Child already closed');
                    xcallback();
                }
            });
        }
        // run the closing tasks
        async.series(tasks, callback);
    }
}

// exports the process handler
module.exports = ProcessHandler;
