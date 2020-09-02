const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

exports.googlePassportConfig = (passport) => {
    passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:8080/auth/google/callback"
        },
        async(accessToken, refreshToken, profile, done) => {
            console.log(profile, 'profile');
            const newUser = {
                googleId: profile.id,
                email: profile.emails[0].value,
                firstname: profile.name.givenName,
                lastname: profile.name.familyName,
                status: 'active'
            }
            try {
                let user = await User.findOne({ googleId: profile.id });
                if (user) {
                    done(null, user)
                } else {
                    user = new User(newUser);
                    await user.save();
                    done(null, user)
                }
            } catch (error) {
                console.log(error)
            }
        }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
}