import { Router } from 'express';
import {
  handleRegisterOtp,
  handleVerifyRegisterOtp,
  handleVerifyOtp,
  handleCompleteRegistration,
  handleLoginPassword,
  handleLoginOtp,
  handleResendOtp,
  handleGoogleAuth,
  handleGetMe,
  handleLogout,
  handleTestEmail
} from '../controllers/authController.js';

const router = Router();

router.post(['/register-otp', '/register'], handleRegisterOtp);
router.post('/verify-register-otp', handleVerifyRegisterOtp);
router.post('/verify-otp', handleVerifyOtp);
router.post('/complete-registration', handleCompleteRegistration);
router.post('/login-password', handleLoginPassword);
router.post('/login-otp', handleLoginOtp);
router.post('/resend-otp', handleResendOtp);
router.post('/google', handleGoogleAuth);
router.get('/me', handleGetMe);
router.post('/logout', handleLogout);
router.post('/test-email', handleTestEmail);

export default router;
