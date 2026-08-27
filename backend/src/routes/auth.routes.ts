import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { authRateLimiter } from '../middleware/security';
import passport from 'passport';
import { config } from '../config';

const router = Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('username').isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Username must be 3-50 characters, alphanumeric and underscore only'),
  body('displayName').optional().isLength({ max: 100 }).withMessage('Display name must be less than 100 characters'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

// Wrap async handlers for route compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wrap = (fn: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Public routes
router.post('/register', authRateLimiter, validate(registerValidation), wrap(AuthController.register));
router.post('/login', authRateLimiter, validate(loginValidation), wrap(AuthController.login));
router.post('/refresh', wrap(AuthController.refreshTokens));

// OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${config.frontendUrl}/login` }),
  (req: Request, res: Response) => {
    res.redirect(config.frontendUrl);
  }
);

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: `${config.frontendUrl}/login` }),
  (req: Request, res: Response) => {
    res.redirect(config.frontendUrl);
  }
);

// Protected routes
router.post('/logout', authenticate, wrap(AuthController.logout));
router.get('/profile', authenticate, wrap(AuthController.getProfile));
router.put('/profile', authenticate, wrap(AuthController.updateProfile));
router.put('/change-password', authenticate, validate(changePasswordValidation), wrap(AuthController.changePassword));

export default router;
