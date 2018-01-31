import Base from 'ember-simple-auth/authenticators/base';
import ENV from '../config/environment';

import { inject as service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import { resolve, reject } from 'rsvp';
import $ from 'jquery';

export default Base.extend({
    session: service('session'),

    logoutEndpoint: `${ENV.APP.HOSTNAME}/auth/logout`,

    restore: function (data) {
        // assuming the cookies is HTTP-only you can't see it from JS
        // so assume it's present
        return isEmpty(data) ?
            reject() :
            resolve(data);
      },

    authenticate: function (options) {
        // no need to do anything with the response - the browser will
        // store the cookie in case of a successful request
        return resolve(options);
    },

    invalidate: function () {
        // if the cookie is HTTP-only you need to invoke a server-side
        // endpoint to have it unset, otherwise you can delete it
        // (`document.cookie = '…'`)
        return $.ajax({
            url: this.logoutEndpoint,
            type: 'GET'
        });
    },
});