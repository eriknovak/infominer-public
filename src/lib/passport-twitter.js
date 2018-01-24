// strategies and configuration files
const TwitterStrategy = require('passport-twitter').Strategy;

/**
 * Configurate the passport object for authentication.
 * @param {Object} passport - The passport object.
 */
module.exports = function (passport) {

    // twitter strategy
    passport.use(new TwitterStrategy(
        require('../config/authConfigTwitter'),
        function(token, tokenSecret, profile, callback) {
            // handle account association - allowing linking
            // and authentication with other identity providers

            // the profile that twitter provides
            let twitterProfile = {
                // account id
                id: profile.id,
                // username displayname
                username: profile.displayName,
                // username image
                userImage: profile.photos.length > 0 ? profile.photos[0].value : null,
                // provider of the profile
                provider: profile.provider
            };
            // return the profile as a response
            return callback(null, twitterProfile);
        }
    ));
};