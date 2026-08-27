import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import User from '../models/User';
import { redis } from '../config/redis';
import { AppError } from '../utils/AppError';

export interface AuthRequest extends Request {
  user?: User;
  userId?: string;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new AppError('Token has been revoked.', 401);
    }

    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      throw new AppError('User not found.', 401);
    }

    if (user.status !== 'active') {
      throw new AppError('Account is not active.', 401);
    }

    authReq.user = user;
    authReq.userId = user.id;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired.', 401));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token.', 401));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      await authenticate(req, res, next);
    } else {
      next();
    }
  } catch (error) {
    next();
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return next(new AppError('Access denied.', 401));
    }

    if (!roles.includes(authReq.user.role)) {
      return next(new AppError('Insufficient permissions.', 403));
    }

    next();
  };
};

export const socketAuth = async (socket: any, next: Function) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
    const user = await User.findByPk(decoded.userId);

    if (!user || user.status !== 'active') {
      return next(new Error('Authentication error'));
    }

    socket.userId = user.id;
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};
