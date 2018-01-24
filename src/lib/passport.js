/**
 * Configurate the passport object for authentication.
 * @param {Object} passport - The passport object.
 */
module.exports = function (passport) {
    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    // used to deserialize the object gor the session
    passport.deserializeUser(function(obj, done) {
        done(null, obj);
    });

    // passport configuration
    require('./passport-google')(passport);
    require('./passport-twitter')(passport);

};