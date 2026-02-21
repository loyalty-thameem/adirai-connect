import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../../modules/auth/auth.service.js';
import { UserModel } from '../../modules/users/user.model.js';

export type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
    role: string;
    sessionId: string;
  };
};

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing bearer token' });
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ message: 'Invalid access token' });
    return;
  }

  const user = await UserModel.findById(payload.sub).lean();
  if (!user || user.status !== 'active') {
    res.status(401).json({ message: 'User not active' });
    return;
  }

  req.auth = {
    userId: payload.sub,
    role: payload.role,
    sessionId: payload.sessionId,
  };
  next();
}

export function requireRoles(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    next();
  };
}

