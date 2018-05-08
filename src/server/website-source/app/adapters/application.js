import DS from 'ember-data';
import ENV from 'infominer-website/config/environment';

export default DS.RESTAdapter.extend({
    host: ENV.APP.HOSTNAME,
    namespace: 'api'
});
