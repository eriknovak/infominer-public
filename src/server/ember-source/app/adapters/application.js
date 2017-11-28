import DS from 'ember-data';
import ENV from 'ember-source/config/environment';

export default DS.RESTAdapter.extend({
    host: ENV.APP.HOSTNAME,
    namespace: 'api'
});
