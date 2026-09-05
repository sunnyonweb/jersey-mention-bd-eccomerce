import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, User } from '../src/types';
import { findUserById } from './mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const _filename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(_filename);

const JWT_SECRET = process.env.JWT_SECRET || 'jersey_mention_bd_jwt_super_secret_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // Fallback to cookie or query parameter
  if (!token && req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(); // Proceed as guest
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: UserRole };
    const user = await findUserById(decoded.id);
    if (user && user.status === 'active') {
      const sanitizedUser = user.toObject() as User;
      delete sanitizedUser.password;
      delete (sanitizedUser as any).passwordResetTokenHash;
      delete (sanitizedUser as any).passwordResetExpires;
      req.user = sanitizedUser;
    }
  } catch (err) {
    // Invalid token, proceed unauthenticated
  }
  next();
};

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  next();
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires one of [${allowedRoles.join(', ')}] permissions`
      });
    }
    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (req.user.role === 'super_admin' || req.user.permissions?.includes(permission)) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied. Admin permission required.' });
  };
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Handle client-side aborted requests (e.g. browser closed, upload cancelled, network dropped)
  if (err.type === 'request.aborted' || err.code === 'ECONNABORTED' || err.message === 'request aborted' || req.destroyed) {
    if (!res.headersSent) {
      return res.status(400).json({ success: false, message: 'Upload request aborted by client.' });
    }
    return;
  }

  console.error('[Centralized Error Handler]:', err);

  try {
    const logPath = path.join(_dirname, '..', 'stderr.log');
    const timestamp = new Date().toISOString();
    const errorMessage = `[Runtime Error - ${timestamp}] ${req.method} ${req.url}:\n${err.stack || err.message || err}\n\n`;
    fs.writeFileSync(logPath, errorMessage, { flag: 'a' });
  } catch (e) {
    // Ignore logging failures
  }

  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? (err.message || 'Internal Server Error') : 'Something went wrong. Please try again.'
  });
};
