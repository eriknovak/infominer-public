const async = require('async');
// creating child processes
const { fork } = require('child_process');


class ProcessHandler {

    constructor(params) {
        let self = this;

        self._currReqId = 0;
        self._childH = new Map();
        self._callbackH = new Map();
        self._processPath = params.processPath;
    }

    createChild(childId) {
        let self = this;
        let child = fork(self._processPath, [], { silent: false });
        self._childH.set(childId, { child, connected: true });

        child.on('message', function (msg) {
            let reqId = msg.reqId;
            console.log('Request id', reqId);
            let callbackH = self._callbackH.get(reqId);
            if (callbackH) {
                // callback exists
                let callback = callbackH.callback;
                let error = msg.error ? new Error(msg.error) : undefined;
                callback(error, msg.content);
            } else {
                console.log(msg);
            }
        });

        child.on('exit', function () {
            // TODO remove from hash
            console.log('Child deleted');
            self._childH.delete(childId);
        });
    }

    childExist(childId) {
        let self = this;
        return self._getChild(childId) ? true : false;
    }

    _getChild(childId) {
        let self = this;
        return self._childH.get(childId);
    }

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

    sendAndWait(childId, params, callback) {
        console.log(childId);
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
            console.log('Connected');
            // if child is connected
            childH.child.send(msg);
        } else {
            console.log('Disconnected');
            // TODO: handle not connected childs
            callback(new Error('Child is disconnected!'));
        }
        // TODO bolj pametno
        if (self._currReqId % 100) {
            self._cleanReqMap();
        }
    }

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

    closeAllProcesses(callback) {
        let self = this;
        let tasks = [ ];
        for (let key of self._childH.keys()) {
            console.log(key);
            tasks.push((xcallback) => {
                console.log('Running task for child id=', key);
                try {
                    self.sendAndWait(key, { cmd: 'shutdown' }, (error, content) => {
                        if (error) {
                            console.log('Disconnected with error');
                            console.log(error.message);
                        }
                        xcallback();
                    });
                } catch (err) {
                    console.log('Child already closed');
                    console.log(err.message);
                    xcallback();
                }
            });
        }
        // run the closing tasks
        async.series(tasks, callback);
    }
}

module.exports = ProcessHandler;


/**
 * Child process instance.
 * @typedef child_object
 * @type {Object}
 * @property {Number} id - Postgresql dataset id.
 * @property {Object} child - The forked child process.
 */
