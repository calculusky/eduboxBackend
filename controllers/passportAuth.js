const passport = require('passport');


//signup or signin with google
exports.getPassportAuthGoogleProfile = passport.authenticate('google', { scope: ['profile', 'email'] });

exports.getPassportAuthGoogleFailure = passport.authenticate('google', { failureRedirect: '/login' }); //auth failed

exports.getPassportAuthGoogleSuccess = (req, res) => {
    // Successful authentication
    res.redirect('/');
}
