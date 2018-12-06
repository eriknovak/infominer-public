import DS from 'ember-data';
import ENV from 'infominer-website/config/environment';
import DataAdapterMixin from 'ember-simple-auth/mixins/data-adapter-mixin';

export default DS.RESTAdapter.extend(DataAdapterMixin, {
    authorizer: 'authorizer:application',
    host: ENV.APP.HOSTNAME,

    createRecord(store, type, snapshot) {
        let self = this;

        let data = {};
        let serializer = store.serializerFor(type.modelName);
        let url = self.buildURL(type.modelName, null, snapshot, 'createRecord');
        serializer.serializeIntoHash(data, type, snapshot, { includeId: true });

        function _checkStatus(params) {
            let { hash, status, methodId } = params;
            if (status === 'finished' && methodId) {

                // the process has been finished, get the data
                return self.ajax(`${url}/${methodId}`, 'GET');

            } else if (status === 'processing') {

                // creates a promise request which waits for 10 seconds
                const request = new Promise((resolve, reject) => {
                    self.set('timeout', setTimeout(function () {
                            // TODO: handle exceptions
                            self.ajax(`${url}/status?hash=${hash}`, 'GET')
                                .then(params => resolve(params));
                        }, 10000)
                    );
                });

                // return the request promise
                return request.then(response => {
                    if (!response.hash) { response.hash = hash; }
                    return _checkStatus(response);
                });
            }
        }

        // send the method parameters to the server
        return self.ajax(url, 'POST', { data: data })
            .then(response => _checkStatus(response));

    }

});
