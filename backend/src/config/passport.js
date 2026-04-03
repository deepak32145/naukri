const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User.model');
const CandidateProfile = require('../models/CandidateProfile.model');
const { generateToken } = require('../utils/generateToken');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
  passReqToCallback: true,
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const role = req.query.state || 'candidate'; // Get role from state
    let user = await User.findOne({ email });

    if (user) {
      // User exists, just return
      return done(null, user);
    } else {
      // Create new user
      user = await User.create({
        name: profile.displayName,
        email,
        role, // Use selected role
        isEmailVerified: true, // Google verified
        isOAuth: true,
        avatar: profile.photos[0] ? { url: profile.photos[0].value } : undefined,
      });

      // Create candidate profile if role is candidate
      if (role === 'candidate') {
        await CandidateProfile.create({ userId: user._id });
      }

      return done(null, user);
    }
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;