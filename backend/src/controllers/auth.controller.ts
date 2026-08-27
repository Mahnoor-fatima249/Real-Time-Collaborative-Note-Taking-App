import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../middleware/errorHandler';
import { config } from '../config';

export class AuthController {
  static register = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { email, password, username, displayName } = req.body;

    const result = await AuthService.register({
      email,
      password,
      username,
      displayName: displayName || username,
    });

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      data: {
        user: result.user.toSafeObject(),
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.expiresIn,
      },
    });
  });

  static login = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;
    const userAgent = req.get('user-agent');
    const ipAddress = req.ip;

    const result = await AuthService.login({ email, password }, userAgent, ipAddress);

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        user: result.user.toSafeObject(),
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.expiresIn,
      },
    });
  });

  static refreshTokens = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: { message: 'Refresh token required' },
      });
      return;
    }

    const tokens = await AuthService.refreshTokens(refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
    });
  });

  static logout = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const token = req.headers.authorization?.split(' ')[1];
    await AuthService.logout(req.userId!, token);

    res.clearCookie('refreshToken');
    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  });

  static googleCallback = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const result = await AuthService.handleOAuthLogin('google', req.user as any);

    const frontendUrl = `${config.frontendUrl}/auth/callback?token=${result.tokens.accessToken}&refresh=${result.tokens.refreshToken}`;

    res.redirect(frontendUrl);
  });

  static githubCallback = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const result = await AuthService.handleOAuthLogin('github', req.user as any);

    const frontendUrl = `${config.frontendUrl}/auth/callback?token=${result.tokens.accessToken}&refresh=${result.tokens.refreshToken}`;

    res.redirect(frontendUrl);
  });

  static getProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const user = await AuthService.getUserProfile(req.userId!);

    res.json({
      success: true,
      data: { user: user.toSafeObject() },
    });
  });

  static updateProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const user = await AuthService.updateProfile(req.userId!, req.body);

    res.json({
      success: true,
      data: { user: user.toSafeObject() },
    });
  });

  static changePassword = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { currentPassword, newPassword } = req.body;
    await AuthService.changePassword(req.userId!, currentPassword, newPassword);

    res.json({
      success: true,
      data: { message: 'Password changed successfully' },
    });
  });
}
