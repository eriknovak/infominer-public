import Base from 'ember-simple-auth/authenticators/base';
import ENV from '../config/environment';
import { inject as service } from '@ember/service';

export default Base.extend({
    session: service('session'),

    logoutEndpoint: `${ENV.APP.HOSTNAME}/auth/logout`,

    restore: function (data) {
        // assuming the cookies is HTTP-only you can't see it from JS
        // so assume it's present
        console.log('restore');
        console.log(data);
        return Ember.isEmpty(data) ?
            Ember.RSVP.reject() :
            Ember.RSVP.resolve(data);
      },

    authenticate: function (options) {
        console.log('authenticate');
        console.log(options);
        // no need to do anything with the response - the browser will
        // store the cookie in case of a successful request
        return Ember.RSVP.resolve(options);
    },

    invalidate: function () {
        // if the cookie is HTTP-only you need to invoke a server-side
        // endpoint to have it unset, otherwise you can delete it
        // (`document.cookie = '…'`)
        console.log('invalidate');
        return Ember.$.ajax({
            url: this.logoutEndpoint,
            type: 'GET'
        });
    },
});