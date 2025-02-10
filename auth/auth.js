const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const admin = require('../config/config');

const db = admin.firestore();

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/google/callback",
        passReqToCallback : true
    },
    async function(request, accessToken, refreshToken, profile, done) {
        try {
            const userRef = db.collection('users').doc(profile.id);
            const doc = await userRef.get();

            if (!doc.exists) {
                // Create new user in Firestore
                await userRef.set({
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.email,
                    picture: profile.picture,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }

            return done(null, profile);
        } catch (error) {
            return done(error, null);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);  // Only store user ID in session
});

passport.deserializeUser(async (id, done) => {
    try {
        const userRef = db.collection("users").doc(id);
        const userSnapshot = await userRef.get();

        if (!userSnapshot.exists) {
            return done(null, false);
        }

        done(null, userSnapshot.data());
    } catch (error) {
        done(error, null);
    }
});
