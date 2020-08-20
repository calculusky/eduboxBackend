const passport = require('passport');


//signup or signin with google
exports.passportAuthGoogleProfile = passport.authenticate('google', { scope: ['profile', 'email'] });

exports.passportAuthGoogleFailure = passport.authenticate('google', { failureRedirect: '/login' }); //auth failed

exports.passportAuthGoogleSuccess = (req, res) => {
    // Successful authentication
    res.redirect('/');
}
