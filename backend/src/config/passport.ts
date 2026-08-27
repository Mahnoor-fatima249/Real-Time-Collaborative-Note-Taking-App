import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { config } from '../config';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger';

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const result = await AuthService.handleOAuthLogin('google', profile);
        done(null, { user: result.user, tokens: result.tokens });
      } catch (error) {
        logger.error('Google OAuth error:', error);
        done(error as Error);
      }
    }
  )
);

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: config.github.clientId,
      clientSecret: config.github.clientSecret,
      callbackURL: config.github.callbackUrl,
      scope: ['user:email'],
    },
    async (accessToken: string, refreshToken: string, profile: any, done: Function) => {
      try {
        const result = await AuthService.handleOAuthLogin('github', profile);
        done(null, { user: result.user, tokens: result.tokens });
      } catch (error) {
        logger.error('GitHub OAuth error:', error);
        done(error as Error);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;
