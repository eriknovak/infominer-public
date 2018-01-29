/**
 * Handles authentication.
 * @param {Object} app - The express app.
 * @param {Object} passport - The authentication handler.
 */
module.exports = function (app, passport, ignoreSecurity) {

    /////////////////////////////////////////////
    // GOOGLE authentication
    /////////////////////////////////////////////

    app.get('/auth/google',
        passport.authenticate('google', {
            failureRedirect: '/login',
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile'
            ]
        })
    );

    app.get('/auth/google/callback',
        passport.authenticate('google', {
            failureRedirect: '/login'
        }),
        function (req, res) {
            res.redirect('/');
        }
    );


    /////////////////////////////////////////////
    // TWITTER authentication
    /////////////////////////////////////////////

    app.get('/auth/twitter',
        passport.authenticate('twitter', {
            failureRedirect: '/login'
        })
    );

    app.get('/auth/twitter/callback',
        passport.authenticate('twitter', {
            failureRedirect: '/login'
        }),
        function (req, res) {
            res.redirect('/');
        }
    );


    /////////////////////////////////////////////
    // Check client session connection
    /////////////////////////////////////////////

    app.get('/auth/account', function (req, res) {
        // prepare authentication object
        // TODO: return only user information, NOT whole object
        let authentication = req.isAuthenticated() ?
            { authenticated: true, user: req.user } :
            { authenticated: false, user: null };
        // response with a json object
        res.json(authentication);
    });


    /////////////////////////////////////////////
    // Logout
    /////////////////////////////////////////////
    app.get('/auth/logout', function (req, res) {
        req.logout();
        res.end();
    });


    /////////////////////////////////////////////
    // Handle security checks
    /////////////////////////////////////////////

    if (!ignoreSecurity) {
        // if security is enabled - add authentication check
        app.all('/api/*', function (req, res, next) {
            // check if user is authenticated - continue with serving data
            if (req.isAuthenticated()) { return next(); }
            // otherwise send authentication error
            return res.send({ errors: { msg: 'User not authenticated' } });
        });
    }

};