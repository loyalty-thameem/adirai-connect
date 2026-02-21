import { Router } from 'express';
import {
  forceLogoutUser,
  logout,
  mySessionHistory,
  oauthLogin,
  refreshSession,
  requestPasswordResetOtp,
  loginWithPassword,
  register,
  resetPassword,
  requestOtp,
  userSessionHistoryForAdmin,
  verifyOtpLogin,
} from './auth.controller.js';
import { requireAuth, requireRoles } from '../../common/middleware/auth.js';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/otp/request', requestOtp);
authRouter.post('/password/forgot', requestPasswordResetOtp);
authRouter.post('/otp/verify', verifyOtpLogin);
authRouter.post('/login/password', loginWithPassword);
authRouter.post('/login/oauth', oauthLogin);
authRouter.post('/token/refresh', refreshSession);
authRouter.post('/logout', requireAuth, logout);
authRouter.post('/password/reset', resetPassword);
authRouter.get('/sessions/me', requireAuth, mySessionHistory);
authRouter.post(
  '/sessions/force-logout',
  requireAuth,
  requireRoles(['super_admin', 'admin']),
  forceLogoutUser,
);
authRouter.get(
  '/sessions/user/:userId',
  requireAuth,
  requireRoles(['super_admin', 'admin', 'moderator']),
  userSessionHistoryForAdmin,
);
