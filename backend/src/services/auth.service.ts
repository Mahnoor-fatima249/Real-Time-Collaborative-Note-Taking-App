import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, RefreshToken } from '../models';
import { config } from '../config';
import { redis } from '../config/redis';
import { AppError, ConflictError, NotFoundError, UnauthorizedError } from '../utils/AppError';
import { logger } from '../utils/logger';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface CreateUserDTO {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

interface LoginDTO {
  email: string;
  password: string;
}

export class AuthService {
  static generateTokens(userId: string): TokenPair {
    const accessToken = jwt.sign({ userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as string,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(
      { userId, tokenVersion: uuidv4() },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn as string } as jwt.SignOptions
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: config.jwt.expiresIn,
    };
  }

  static async blacklistToken(token: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await redis.set(`blacklist:${token}`, '1', 'EX', ttl);
        }
      }
    } catch (error) {
      logger.error('Error blacklisting token:', error);
    }
  }

  static async register(data: CreateUserDTO): Promise<{ user: User; tokens: TokenPair }> {
    const existingUser = await User.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const existingUsername = await User.findOne({ where: { username: data.username } });
    if (existingUsername) {
      throw new ConflictError('Username already taken');
    }

    const user = await User.create({
      email: data.email,
      password: data.password,
      username: data.username,
      displayName: data.displayName,
      provider: 'local',
    });
    const tokens = this.generateTokens(user.id);

    // Store refresh token
    await RefreshToken.create({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    logger.info(`New user registered: ${user.email}`);

    return { user, tokens };
  }

  static async login(data: LoginDTO, userAgent?: string, ipAddress?: string): Promise<{ user: User; tokens: TokenPair }> {
    const user = await User.findOne({ where: { email: data.email } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.provider !== 'local') {
      throw new UnauthorizedError(`Please login with ${user.provider}`);
    }

    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedError('Account is not active');
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    const tokens = this.generateTokens(user.id);

    // Store refresh token
    await RefreshToken.create({
      userId: user.id,
      token: tokens.refreshToken,
      userAgent,
      ipAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    logger.info(`User logged in: ${user.email}`);

    return { user, tokens };
  }

  static async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;

      const storedToken = await RefreshToken.findOne({
        where: {
          userId: decoded.userId,
          token: refreshToken,
          isRevoked: false,
        },
      });

      if (!storedToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Revoke old refresh token
      await storedToken.update({ isRevoked: true });

      // Generate new tokens
      const tokens = this.generateTokens(decoded.userId);

      // Store new refresh token
      await RefreshToken.create({
        userId: decoded.userId,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      return tokens;
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  static async logout(userId: string, token?: string): Promise<void> {
    if (token) {
      await this.blacklistToken(token);
    }

    // Revoke all refresh tokens for the user
    await RefreshToken.update(
      { isRevoked: true },
      { where: { userId } }
    );

    logger.info(`User logged out: ${userId}`);
  }

  static async handleOAuthLogin(
    provider: 'google' | 'github',
    profile: any
  ): Promise<{ user: User; tokens: TokenPair; isNewUser: boolean }> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new AppError('Email not provided from OAuth', 400);
    }

    let isNewUser = false;
    let user = await User.findOne({
      where: { provider, providerId: profile.id },
    });

    if (!user) {
      user = await User.findOne({ where: { email } });
      if (user) {
        // Link existing account
        await user.update({
          provider,
          providerId: profile.id,
          avatar: profile.photos?.[0]?.value || user.avatar,
        });
      } else {
        // Create new user
        const username = email.split('@')[0] + '_' + uuidv4().slice(0, 8);
        user = await User.create({
          email,
          username,
          displayName: profile.displayName || email.split('@')[0],
          avatar: profile.photos?.[0]?.value,
          provider,
          providerId: profile.id,
          isEmailVerified: true,
        });
        isNewUser = true;
      }
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    const tokens = this.generateTokens(user.id);

    // Store refresh token
    await RefreshToken.create({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    logger.info(`OAuth login: ${user.email} via ${provider}`);

    return { user, tokens, isNewUser };
  }

  static async getUserProfile(userId: string): Promise<User> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  }

  static async updateProfile(userId: string, data: Partial<CreateUserDTO>): Promise<User> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (data.email && data.email !== user.email) {
      const existing = await User.findOne({ where: { email: data.email } });
      if (existing) {
        throw new ConflictError('Email already in use');
      }
    }

    if (data.username && data.username !== user.username) {
      const existing = await User.findOne({ where: { username: data.username } });
      if (existing) {
        throw new ConflictError('Username already taken');
      }
    }

    await user.update(data);
    return user;
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.provider !== 'local') {
      throw new AppError('Cannot change password for OAuth accounts', 400);
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    await user.update({ password: newPassword });

    // Revoke all refresh tokens
    await RefreshToken.update(
      { isRevoked: true },
      { where: { userId } }
    );
  }
}
