import { Router } from 'express';
import {
  loginWithPassword,
  oauthCallback,
  register,
  requestOtp,
  verifyOtpLogin,
} from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/otp/request', requestOtp);
authRouter.post('/otp/verify', verifyOtpLogin);
authRouter.post('/login/password', loginWithPassword);
authRouter.get('/oauth/:provider/callback', oauthCallback);

