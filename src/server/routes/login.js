/**
 * Handles authentication.
 * @param {Object} app - The express app.
 * @param {Object} passport - The authentication handler.
 */
module.exports = function (app, passport) {

    /**
     * GOOGLE authentication
     */
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

    /**
     * TWITTER authentication
     */
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

    /**
     * Checks if the client has a session connection -
     *
     */
    app.get('/auth/account', function (req, res) {
        // prepare authentication object
        let authentication = req.isAuthenticated() ?
            { authenticated: true, user: req.user } :
            { authenticated: false, user: null };
        // response with a json object
        res.json(authentication);
    });

    /**
     * Set logout
     */
    app.get('/auth/logout', function (req, res) {
        req.logout();
        res.end();
    });

    /**
     * Check if the user is authenticated for
     * all /api/ subroutes
     */
    // app.all('/api/*', (req, res, next) => {
    //     console.log(req.isAuthenticated());
    //     // if user is authenticated in the session, carry on
    //     if (req.isAuthenticated()) { return next(); }
    //     // if they aren't send an empty response
    //     res.send({ });
    // });

};