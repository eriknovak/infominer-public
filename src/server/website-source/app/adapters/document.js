import DS from 'ember-data';
import ENV from 'infominer-website/config/environment';
import DataAdapterMixin from 'ember-simple-auth/mixins/data-adapter-mixin';

export default DS.RESTAdapter.extend(DataAdapterMixin, {
    authorizer: 'authorizer:application',
    host: ENV.APP.HOSTNAME
});
