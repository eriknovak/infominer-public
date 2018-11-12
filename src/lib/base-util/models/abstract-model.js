class AbstractModel {

    constructor(base, params, subset, fields) {
        this.base = base;
        this.params = params;
        this.subset = subset;
        this.fields = fields;
    }


    update(params) {
        throw new Error('Method "update" must be implemented');
    }

    run() {
        throw new Error('Method "run" must be implemented');
    }

    save(fin) {
        throw new Error('Method "save" must be implemented');
    }

    load(fout) {
        throw new Error('Method "load" must be implemented');
    }

    _promiseSerial(funcs) {
        funcs.reduce((promise, func) =>
            promise.then(result => func(result)),
            Promise.resolve([]));
    }

}

module.exports = AbstractModel;