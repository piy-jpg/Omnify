import {
  requestRegisterOtp,
  verifyRegisterOtp,
  completeRegistrationWithPassword,
  loginWithPassword,
  requestLoginOtp,
  verifyOtpAndAuthenticate,
  authenticateWithGoogle,
  getSessionUser,
  destroySession
} from '../../auth/authService.js';
import { extractSessionToken } from '../../auth/authMiddleware.js';
import { testSmtpConnection, sendEmailOtp } from '../../services/email/emailService.js';

export async function handleRegisterOtp(req, res) {
  try {
    const result = await requestRegisterOtp(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function handleVerifyRegisterOtp(req, res) {
  try {
    const result = await verifyRegisterOtp(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function handleVerifyOtp(req, res) {
  try {
    const { purpose } = req.body;
    if (purpose === 'register' || req.body.registrationId?.startsWith('reg_')) {
      const result = await verifyRegisterOtp(req.body);
      return res.json(result);
    }
    const result = await verifyOtpAndAuthenticate(req.body);
    if (result.sessionToken) {
      res.cookie('omni_session', result.sessionToken, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
    }
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function handleCompleteRegistration(req, res) {
  try {
    const result = await completeRegistrationWithPassword(req.body);
    if (result.sessionToken) {
      res.cookie('omni_session', result.sessionToken, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
    }
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function handleLoginPassword(req, res) {
  try {
    const result = await loginWithPassword(req.body);
    if (result.sessionToken) {
      res.cookie('omni_session', result.sessionToken, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
    }
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function handleLoginOtp(req, res) {
  try {
    const result = await requestLoginOtp(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function handleResendOtp(req, res) {
  try {
    const { purpose } = req.body;
    if (purpose === 'login') {
      const result = await requestLoginOtp(req.body);
      return res.json(result);
    }
    const result = await requestRegisterOtp(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function handleGoogleAuth(req, res) {
  try {
    const result = await authenticateWithGoogle(req.body);
    if (result.sessionToken) {
      res.cookie('omni_session', result.sessionToken, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
    }
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function handleGetMe(req, res) {
  try {
    const sessionToken = extractSessionToken(req);
    if (!sessionToken) {
      return res.status(401).json({ success: false, error: 'No active session.' });
    }

    const user = await getSessionUser(sessionToken);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Session expired or invalid.' });
    }

    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve user session.' });
  }
}

export async function handleLogout(req, res) {
  try {
    const sessionToken = extractSessionToken(req);
    if (sessionToken) {
      await destroySession(sessionToken);
    }

    res.clearCookie('omni_session');
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Logout failed.' });
  }
}

export async function handleTestEmail(req, res) {
  try {
    const { toEmail } = req.body;
    if (!toEmail) {
      const conn = await testSmtpConnection();
      return res.json({ success: true, mode: 'verify_connection', result: conn });
    }

    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const result = await sendEmailOtp({
      toEmail,
      otpCode: testOtp,
      recipientName: 'OMNIFY Tester'
    });

    return res.json({
      success: true,
      message: `Test email dispatched to ${toEmail}`,
      testOtp,
      result
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Test email failed.' });
  }
}
