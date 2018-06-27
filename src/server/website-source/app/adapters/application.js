import DS from 'ember-data';
import ENV from 'infominer-website/config/environment';

export default DS.RESTAdapter.extend({
    host: ENV.APP.HOSTNAME,
    namespace: 'api',

    handleResponse(status, headers, payload, requestData) {
        if (payload.errors) { payload.errors = DS.errorsHashToArray(payload.errors); }
        return this._super(...arguments);
    }

});
