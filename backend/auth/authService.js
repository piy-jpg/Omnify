/**
 * OMNIFY Authentication Service
 * Manages user authentication, OTP lifecycle, PBKDF2 password security,
 * stateless HMAC-SHA256 tokens, Google OAuth, and persistent sessions.
 */

import crypto from 'crypto';
import { UserModel } from '../database/models/userModel.js';
import { SessionModel } from '../database/models/sessionModel.js';
import { hashPassword, verifyPassword, generateCryptoOtp, hashOtp } from './passwordUtils.js';
import { createSignedToken, verifySignedToken } from './jwtHelper.js';
import { normalizeEmail, sendEmailOtp } from '../services/email/emailService.js';
import { VALID_USER_CATEGORIES, DEFAULT_LIFETIME_PLAN, DEFAULT_STORAGE_QUOTA_GB } from '../config/constants.js';

export function normalizePhoneNumber(rawPhone, defaultCountryCode = '+91') {
  if (!rawPhone) return '';
  let cleaned = String(rawPhone).trim().replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = `${defaultCountryCode}${cleaned}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = `+${cleaned}`;
    } else {
      cleaned = `+${cleaned}`;
    }
  }
  return cleaned;
}

export function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

// In-memory OTP cache for fast lookup
const otpStore = new Map();

/**
 * STEP 1: Request Registration OTP
 */
export async function requestRegisterOtp({ name, email, category, age, phone }) {
  const trimmedName = String(name || '').trim();
  if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 80) {
    throw new Error('Please enter your full name (2 to 80 characters).');
  }

  if (!category || !VALID_USER_CATEGORIES.includes(category)) {
    throw new Error('Please select your domain / category.');
  }

  const numAge = parseInt(age, 10);
  if (isNaN(numAge) || numAge < 8 || numAge > 120) {
    throw new Error('Please enter a valid age between 8 and 120.');
  }

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  // Check if user is already registered with password
  const existingUser = UserModel.findByEmail(normalizedEmail);
  if (existingUser && existingUser.passwordHash) {
    throw new Error('An account with this email address already exists. Please log in.');
  }

  // Rate Limiting check
  const existingPending = otpStore.get(`email_${normalizedEmail}`);
  const now = Date.now();
  if (existingPending && existingPending.resendAvailableAt > now) {
    const waitSecs = Math.ceil((existingPending.resendAvailableAt - now) / 1000);
    throw new Error(`Please wait ${waitSecs} seconds before requesting another code.`);
  }

  // Generate 6-digit OTP and HMAC salt
  const otpCode = generateCryptoOtp();
  const salt = crypto.randomBytes(16).toString('hex');
  const hashedOtp = hashOtp(otpCode, salt);

  // Generate Stateless Signed Registration Token (valid for 10 minutes)
  const tokenPayload = {
    type: 'reg_otp',
    email: normalizedEmail,
    name: trimmedName,
    category,
    age: numAge,
    phone: phone ? normalizePhoneNumber(phone) : '',
    salt,
    hashedOtp,
    exp: now + 10 * 60 * 1000
  };
  const registrationId = createSignedToken(tokenPayload);

  const otpRecord = {
    registrationId,
    name: trimmedName,
    email: normalizedEmail,
    category,
    age: numAge,
    phone: phone ? normalizePhoneNumber(phone) : '',
    salt,
    hashedOtp,
    attempts: 0,
    maxAttempts: 5,
    createdAt: now,
    expiresAt: now + 10 * 60 * 1000,
    resendAvailableAt: now + 30 * 1000
  };

  otpStore.set(registrationId, otpRecord);
  otpStore.set(`email_${normalizedEmail}`, otpRecord);

  // Dispatch Email OTP
  const emailResult = await sendEmailOtp({
    toEmail: normalizedEmail,
    otpCode,
    recipientName: trimmedName
  });

  return {
    success: true,
    registrationId,
    email: normalizedEmail,
    maskedEmail: maskEmail(normalizedEmail),
    resendCooldown: 30,
    expiresIn: 600,
    provider: emailResult.provider,
    devOtp: emailResult.devOtp,
    message: `Verification code sent to ${maskEmail(normalizedEmail)}`
  };
}

/**
 * STEP 2: Verify Registration OTP
 */
export async function verifyRegisterOtp({ registrationId, email, identifier, otp }) {
  const normalizedEmail = normalizeEmail(email || identifier);

  // 1. Verify via Signed Stateless Token
  let record = verifySignedToken(registrationId);
  if (!record || record.type !== 'reg_otp') {
    // 2. Fallback to in-memory store
    const key = registrationId || (normalizedEmail ? `email_${normalizedEmail}` : null);
    if (key) {
      record = otpStore.get(key);
      if (!record && normalizedEmail) {
        record = otpStore.get(`email_${normalizedEmail}`);
      }
    }
  }

  if (!record) {
    throw new Error('Verification session expired or not found. Please request a new code.');
  }

  const now = Date.now();
  const expiry = record.exp || record.expiresAt;
  if (expiry && now > expiry) {
    if (record.registrationId) otpStore.delete(record.registrationId);
    if (record.email) otpStore.delete(`email_${record.email}`);
    throw new Error('Verification code has expired. Please request a new one.');
  }

  const cleanOtp = String(otp || '').trim();
  const inputHash = hashOtp(cleanOtp, record.salt);

  if (inputHash !== record.hashedOtp) {
    throw new Error('Invalid verification code. Please check your email and try again.');
  }

  // Issue Cryptographically Signed Temporary Completion Token (valid for 30 minutes)
  const verifiedPayload = {
    type: 'temp_verified',
    email: record.email || normalizedEmail,
    name: record.name,
    category: record.category,
    age: record.age,
    phone: record.phone || '',
    verifiedAt: now,
    exp: now + 30 * 60 * 1000
  };
  const tempToken = createSignedToken(verifiedPayload);

  if (record.registrationId) {
    record.verified = true;
    record.tempToken = tempToken;
    otpStore.set(record.registrationId, record);
  }

  return {
    success: true,
    verified: true,
    registrationId: registrationId || record.registrationId,
    email: record.email || normalizedEmail,
    tempToken,
    message: 'Email verified successfully! Please create your password.'
  };
}

/**
 * STEP 3: Complete Registration With Password
 */
export async function completeRegistrationWithPassword({ registrationId, email, identifier, password, tempToken }) {
  const normalizedEmail = normalizeEmail(email || identifier);

  // Verify Temp Token or memory store
  let record = verifySignedToken(tempToken);
  if (!record || record.type !== 'temp_verified') {
    const key = registrationId || (normalizedEmail ? `email_${normalizedEmail}` : null);
    if (key) {
      record = otpStore.get(key);
      if (!record && normalizedEmail) {
        record = otpStore.get(`email_${normalizedEmail}`);
      }
    }
  }

  if (!record) {
    throw new Error('Verification session expired or not found. Please request a new code.');
  }

  const targetEmail = normalizeEmail(record.email || normalizedEmail);
  const trimmedPassword = String(password || '').trim();
  if (trimmedPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const { salt: passwordSalt, hash: passwordHash } = hashPassword(trimmedPassword);
  const existingUser = UserModel.findByEmail(targetEmail);
  const userId = existingUser ? existingUser.id : `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const newUser = {
    id: userId,
    name: record.name || targetEmail.split('@')[0],
    email: targetEmail,
    phone: record.phone || '',
    category: record.category || 'Developer',
    age: record.age || 22,
    emailVerified: true,
    phoneVerified: Boolean(record.phone),
    passwordSalt,
    passwordHash,
    plan: DEFAULT_LIFETIME_PLAN,
    storageQuotaGb: DEFAULT_STORAGE_QUOTA_GB,
    createdAt: existingUser ? existingUser.createdAt : new Date().toISOString()
  };

  UserModel.save(newUser);

  if (registrationId) otpStore.delete(registrationId);
  otpStore.delete(`email_${targetEmail}`);

  // Create Stateless Signed 30-Day Session Token
  const sessionPayload = {
    type: 'session',
    userId: newUser.id,
    email: newUser.email,
    name: newUser.name,
    category: newUser.category,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000
  };
  const sessionToken = createSignedToken(sessionPayload);
  SessionModel.create(sessionToken, { userId: newUser.id, email: newUser.email });

  return {
    success: true,
    user: UserModel.toPublicProfile(newUser),
    sessionToken,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    message: 'Welcome to OMNIFY! Your account is active.'
  };
}

/**
 * Login with Email and Password
 */
export async function loginWithPassword({ email, identifier, password }) {
  const normalizedEmail = normalizeEmail(email || identifier);
  if (!normalizedEmail) {
    throw new Error('Please enter your email address.');
  }

  const user = UserModel.findByEmail(normalizedEmail);
  if (!user || !user.passwordHash || !user.passwordSalt) {
    throw new Error('No account found with this email, or password is not set.');
  }

  const isValid = verifyPassword(password, user.passwordSalt, user.passwordHash);
  if (!isValid) {
    throw new Error('Incorrect password. Please try again.');
  }

  const sessionToken = `ses_${crypto.randomBytes(32).toString('hex')}`;
  SessionModel.create(sessionToken, { userId: user.id, email: user.email });

  return {
    success: true,
    user: UserModel.toPublicProfile(user),
    sessionToken,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    message: `Welcome back, ${user.name}!`
  };
}

/**
 * Request Passwordless Login OTP
 */
export async function requestLoginOtp({ email, identifier, registrationId }) {
  const normalizedEmail = normalizeEmail(email || identifier);
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  const user = UserModel.findByEmail(normalizedEmail);
  const recipientName = user ? user.name : 'User';

  const otpCode = generateCryptoOtp();
  const salt = crypto.randomBytes(16).toString('hex');
  const hashedOtp = hashOtp(otpCode, salt);
  const regId = registrationId || `login_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const now = Date.now();
  const otpRecord = {
    registrationId: regId,
    email: normalizedEmail,
    name: recipientName,
    salt,
    hashedOtp,
    attempts: 0,
    maxAttempts: 5,
    createdAt: now,
    expiresAt: now + 5 * 60 * 1000,
    resendAvailableAt: now + 30 * 1000
  };

  otpStore.set(regId, otpRecord);
  otpStore.set(`email_${normalizedEmail}`, otpRecord);

  const emailResult = await sendEmailOtp({
    toEmail: normalizedEmail,
    otpCode,
    recipientName
  });

  return {
    success: true,
    registrationId: regId,
    email: normalizedEmail,
    maskedEmail: maskEmail(normalizedEmail),
    resendCooldown: 30,
    expiresIn: 300,
    provider: emailResult.provider,
    devOtp: emailResult.devOtp,
    message: `Login code dispatched to ${maskEmail(normalizedEmail)}`
  };
}

/**
 * Verify Login OTP and establish session
 */
export async function verifyOtpAndAuthenticate({ registrationId, email, identifier, otp }) {
  const normalizedEmail = normalizeEmail(email || identifier);
  const key = registrationId || (normalizedEmail ? `email_${normalizedEmail}` : null);

  let record = otpStore.get(key);
  if (!record && normalizedEmail) {
    record = otpStore.get(`email_${normalizedEmail}`);
  }

  if (!record) {
    throw new Error('Verification session expired or not found. Please request a new code.');
  }

  const now = Date.now();
  if (now > record.expiresAt) {
    otpStore.delete(record.registrationId);
    otpStore.delete(`email_${record.email}`);
    throw new Error('Verification code has expired. Please request a new code.');
  }

  if (record.attempts >= record.maxAttempts) {
    otpStore.delete(record.registrationId);
    otpStore.delete(`email_${record.email}`);
    throw new Error('Maximum verification attempts exceeded.');
  }

  record.attempts += 1;
  const inputHash = hashOtp(otp, record.salt);

  if (inputHash !== record.hashedOtp) {
    const remaining = record.maxAttempts - record.attempts;
    throw new Error(`Invalid verification code. ${remaining} attempt(s) remaining.`);
  }

  let user = UserModel.findByEmail(record.email);
  if (!user) {
    user = {
      id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      name: record.name || record.email.split('@')[0],
      email: record.email,
      phone: '',
      category: 'Developer',
      age: 22,
      emailVerified: true,
      plan: DEFAULT_LIFETIME_PLAN,
      storageQuotaGb: DEFAULT_STORAGE_QUOTA_GB,
      createdAt: new Date().toISOString()
    };
    UserModel.save(user);
  }

  const sessionToken = `ses_${crypto.randomBytes(32).toString('hex')}`;
  SessionModel.create(sessionToken, { userId: user.id, email: user.email });

  otpStore.delete(record.registrationId);
  otpStore.delete(`email_${record.email}`);

  return {
    success: true,
    user: UserModel.toPublicProfile(user),
    sessionToken,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    message: `Welcome back, ${user.name}!`
  };
}

/**
 * Google OAuth Authentication
 */
export async function authenticateWithGoogle({ email, name, avatar, credential }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('Google authentication payload missing email.');
  }

  let user = UserModel.findByEmail(normalizedEmail);
  if (!user) {
    user = {
      id: `usr_${crypto.randomBytes(12).toString('hex')}`,
      name: name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      category: 'Developer',
      age: 22,
      phone: '',
      provider: 'google',
      avatar: avatar || '',
      emailVerified: true,
      phoneVerified: false,
      plan: 'Lifetime VIP Pass (100% Free)',
      storageQuotaGb: DEFAULT_STORAGE_QUOTA_GB,
      createdAt: new Date().toISOString()
    };
    UserModel.save(user);
  } else {
    if (avatar && !user.avatar) {
      user.avatar = avatar;
      UserModel.save(user);
    }
  }

  const sessionToken = `ses_${crypto.randomBytes(32).toString('hex')}`;
  SessionModel.create(sessionToken, { userId: user.id, email: user.email });

  return {
    success: true,
    user: UserModel.toPublicProfile(user),
    sessionToken,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
  };
}

/**
 * Get User by Session Token
 */
export async function getSessionUser(sessionToken) {
  if (!sessionToken) return null;

  // 1. Verify Signed Stateless Session Token
  const signedPayload = verifySignedToken(sessionToken);
  if (signedPayload && signedPayload.type === 'session') {
    const user = UserModel.findById(signedPayload.userId) || UserModel.findByEmail(signedPayload.email);
    if (user) {
      return UserModel.toPublicProfile(user);
    }

    // Ephemeral serverless fallback
    return {
      id: signedPayload.userId,
      name: signedPayload.name || signedPayload.email.split('@')[0],
      email: signedPayload.email,
      phone: signedPayload.phone || '',
      category: signedPayload.category || 'Developer',
      age: signedPayload.age || 22,
      plan: DEFAULT_LIFETIME_PLAN,
      emailVerified: true,
      storageQuotaGb: DEFAULT_STORAGE_QUOTA_GB,
      createdAt: new Date().toISOString()
    };
  }

  // 2. Fallback to sessions store
  const session = SessionModel.find(sessionToken);
  if (!session) return null;

  const user = UserModel.findById(session.userId) || UserModel.findByEmail(session.email);
  if (!user) return null;

  return UserModel.toPublicProfile(user);
}

/**
 * Invalidate session token
 */
export async function destroySession(sessionToken) {
  if (!sessionToken) return;
  SessionModel.delete(sessionToken);
}
