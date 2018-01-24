// strategies and configuration files
const GoogleStrategy = require('passport-google-oauth20').Strategy;

/**
 * Configurate the passport object for authentication.
 * @param {Object} passport - The passport object.
 */
module.exports = function (passport) {

    // google strategy
    passport.use(new GoogleStrategy(
        require('../config/authConfigGoogle'),
        function (request, accessToken, refreshToken, profile, callback) {
            // handle account association - allowing linking
            // and authentication with other identity providers

            // the profile that google provides
            let googleProfile = {
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
            return callback(null, googleProfile);
        }));
};