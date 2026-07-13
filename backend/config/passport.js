const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

const User = require('../models/User');

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID_HERE') {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/login/oauth2/code/google',
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;

      // Check if user already exists by googleId
      let user = await User.findOne({ googleId: profile.id });
      if (user) return done(null, user);

      // Check if user exists with same email (merge accounts)
      user = await User.findOne({ email });
      if (user) {
        user.googleId = profile.id;
        await user.save();
        return done(null, user);
      }

      // Create new user as employee by default for Google logins
      user = new User({
        name: profile.displayName,
        email,
        googleId: profile.id,
        role: 'employee'
      });
      await user.save();
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
} else {
  console.log('⚠️  Google OAuth not configured — local login only');
}

module.exports = passport;
