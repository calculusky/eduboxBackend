const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');
console.log(process.env.GOOGLE_CALLBACK_URL)

exports.googlePassportConfig = (passport) => {
    passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL
            // callback url for app development mode
            // callbackURL: "https://auth.expo.io/@chizchris15/Edubox-mobile-app"
        },
        async(accessToken, refreshToken, profile, done) => {
            console.log(profile, 'profile');
            const newUser = {
                googleId: profile.id,
                email: profile.emails[0].value,
                firstname: profile.name.givenName,
                lastname: profile.name.familyName,
                institution: null,
                educationlevel: null,
                middlename: null,
                status: 'active'
            }
            try {
                let user = await User.findOne({ googleId: profile.id });
                const emailExist =  await User.findOne({email: profile.emails[0].value});
                if (user) {
                    done(null, user);
                }
                 else {
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