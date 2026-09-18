/**
 * OMNIFY Authentication Service
 * Manages users, cryptographic OTP generation/hashing, PBKDF2 password security,
 * rate limiting, registration IDs, and session tokens.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeEmail, sendEmailOtp } from '../email/emailService.js';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database store file paths (persisted JSON store)
const DATA_DIR = path.join(__dirname, '../../uploads/auth');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_DB_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_DB_FILE = path.join(DATA_DIR, 'sessions.json');

// In-memory OTP & Pending registration state store
// Keyed by registrationId AND normalizedEmail
const otpStore = new Map();

/**
 * PBKDF2 Password Hashing
 */
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, storedHash) {
  if (!password || !salt || !storedHash) return false;
  const hash = crypto.pbkdf2Sync(String(password), salt, 10000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

// Load or initialize users DB
export function readUsers() {
  try {
    if (fs.existsSync(USERS_DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(USERS_DB_FILE, 'utf8'));
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('[Auth Service] Failed to read users:', err);
  }
  return [];
}

export function writeUsers(users) {
  try {
    fs.writeFileSync(USERS_DB_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('[Auth Service] Failed to save users:', err);
  }
}

// Load or initialize sessions DB
export function readSessions() {
  try {
    if (fs.existsSync(SESSIONS_DB_FILE)) {
      return JSON.parse(fs.readFileSync(SESSIONS_DB_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('[Auth Service] Failed to read sessions:', err);
  }
  return {};
}

export function writeSessions(sessions) {
  try {
    fs.writeFileSync(SESSIONS_DB_FILE, JSON.stringify(sessions, null, 2), 'utf8');
  } catch (err) {
    console.error('[Auth Service] Failed to save sessions:', err);
  }
}

/**
 * Generates a cryptographically strong 6-digit numeric OTP
 */
function generateCryptoOtp() {
  const code = crypto.randomInt(100000, 999999).toString();
  return code;
}

/**
 * Hashes an OTP using HMAC-SHA256
 */
function hashOtp(otp, salt) {
  return crypto.createHmac('sha256', salt).update(String(otp).trim()).digest('hex');
}

/**
 * Utility: Mask email for privacy display
 */
export function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

/**
 * STEP 1: Request Registration OTP
 * User enters Name, Category/Domain, Age, Email ID, Phone
 */
export async function requestRegisterOtp({ name, email, category, age, phone }) {
  const trimmedName = String(name || '').trim();
  if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 80) {
    throw new Error('Please enter your full name (2 to 80 characters).');
  }

  const validCategories = [
    'Developer',
    'Student',
    'Designer',
    'Office Professional',
    'Teacher',
    'Researcher',
    'Freelancer',
    'Business',
    'Marketing',
    'Education',
    'Other'
  ];
  if (!category || !validCategories.includes(category)) {
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

  // Check if user is already registered
  const users = readUsers();
  const existingUser = users.find(u => u.email === normalizedEmail);
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
  const registrationId = `reg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

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
    expiresAt: now + 5 * 60 * 1000, // 5 minutes
    resendAvailableAt: now + 30 * 1000 // 30 seconds cooldown
  };

  // Store in memory
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
    expiresIn: 300,
    provider: emailResult.provider,
    devOtp: emailResult.devOtp,
    message: `Verification code sent to ${maskEmail(normalizedEmail)}`
  };
}

/**
 * STEP 2: Verify Registration OTP
 * User inputs 6-digit OTP sent to their email
 */
export async function verifyRegisterOtp({ registrationId, email, identifier, otp }) {
  const normalizedEmail = normalizeEmail(email || identifier);
  const key = registrationId || (normalizedEmail ? `email_${normalizedEmail}` : null);

  if (!key) {
    throw new Error('Missing registration session. Please start registration again.');
  }

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
    throw new Error('Verification code has expired. Please request a new one.');
  }

  if (record.attempts >= record.maxAttempts) {
    otpStore.delete(record.registrationId);
    otpStore.delete(`email_${record.email}`);
    throw new Error('Maximum verification attempts exceeded. Please request a new code.');
  }

  record.attempts += 1;

  const cleanOtp = String(otp || '').trim();
  const inputHash = hashOtp(cleanOtp, record.salt);

  if (inputHash !== record.hashedOtp) {
    const remaining = record.maxAttempts - record.attempts;
    throw new Error(`Invalid verification code. ${remaining} attempt(s) remaining.`);
  }

  // Issue temporary completion token (valid for 15 minutes)
  const tempToken = `tmp_${crypto.randomBytes(24).toString('hex')}`;
  record.verified = true;
  record.tempToken = tempToken;
  record.tempTokenExpiresAt = now + 15 * 60 * 1000;

  return {
    success: true,
    verified: true,
    registrationId: record.registrationId,
    email: record.email,
    tempToken,
    message: 'Email verified successfully! Please create your password.'
  };
}

/**
 * STEP 3: Complete Registration With Password
 * Creates persistent user account and establishes 30-day session
 */
export async function completeRegistrationWithPassword({ registrationId, email, identifier, password, tempToken }) {
  const normalizedEmail = normalizeEmail(email || identifier);
  const key = registrationId || (normalizedEmail ? `email_${normalizedEmail}` : null);

  if (!key) {
    throw new Error('Registration session not found.');
  }

  let record = otpStore.get(key);
  if (!record && normalizedEmail) {
    record = otpStore.get(`email_${normalizedEmail}`);
  }

  if (!record || !record.verified) {
    throw new Error('Please verify your email address first before setting a password.');
  }

  if (record.tempToken !== tempToken) {
    throw new Error('Invalid or expired security token. Please re-verify your email.');
  }

  const trimmedPassword = String(password || '').trim();
  if (trimmedPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  // Hash password using PBKDF2
  const { salt: passwordSalt, hash: passwordHash } = hashPassword(trimmedPassword);

  const users = readUsers();
  const existingIdx = users.findIndex(u => u.email === record.email);

  const userId = existingIdx >= 0 ? users[existingIdx].id : `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const newUser = {
    id: userId,
    name: record.name,
    email: record.email,
    phone: record.phone || '',
    category: record.category || 'Developer',
    age: record.age || 22,
    emailVerified: true,
    phoneVerified: Boolean(record.phone),
    passwordSalt,
    passwordHash,
    plan: '100% Free Lifetime Pass',
    storageQuotaGb: 100,
    createdAt: existingIdx >= 0 ? users[existingIdx].createdAt : new Date().toISOString()
  };

  if (existingIdx >= 0) {
    users[existingIdx] = newUser;
  } else {
    users.push(newUser);
  }

  writeUsers(users);

  // Clean up OTP store
  otpStore.delete(record.registrationId);
  otpStore.delete(`email_${record.email}`);

  // Create persistent session
  const sessionToken = `ses_${crypto.randomBytes(32).toString('hex')}`;
  const sessions = readSessions();
  sessions[sessionToken] = {
    userId: newUser.id,
    email: newUser.email,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
  };
  writeSessions(sessions);

  const publicUser = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    phone: newUser.phone,
    category: newUser.category,
    age: newUser.age,
    plan: newUser.plan,
    emailVerified: true,
    phoneVerified: newUser.phoneVerified,
    storageQuotaGb: newUser.storageQuotaGb,
    createdAt: newUser.createdAt
  };

  return {
    success: true,
    user: publicUser,
    sessionToken,
    expiresAt: sessions[sessionToken].expiresAt,
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

  const users = readUsers();
  const user = users.find(u => u.email === normalizedEmail);

  if (!user || !user.passwordHash || !user.passwordSalt) {
    throw new Error('No account found with this email, or password is not set.');
  }

  const isValid = verifyPassword(password, user.passwordSalt, user.passwordHash);
  if (!isValid) {
    throw new Error('Incorrect password. Please try again.');
  }

  // Create session
  const sessionToken = `ses_${crypto.randomBytes(32).toString('hex')}`;
  const sessions = readSessions();
  sessions[sessionToken] = {
    userId: user.id,
    email: user.email,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
  };
  writeSessions(sessions);

  const publicUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    category: user.category,
    age: user.age,
    plan: user.plan || '100% Free Lifetime Pass',
    emailVerified: user.emailVerified ?? true,
    storageQuotaGb: user.storageQuotaGb || 100,
    createdAt: user.createdAt,
    avatar: user.avatar
  };

  return {
    success: true,
    user: publicUser,
    sessionToken,
    expiresAt: sessions[sessionToken].expiresAt,
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

  const users = readUsers();
  let user = users.find(u => u.email === normalizedEmail);
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

  // Find or create user
  const users = readUsers();
  let user = users.find(u => u.email === record.email);

  if (!user) {
    user = {
      id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      name: record.name || record.email.split('@')[0],
      email: record.email,
      phone: '',
      category: 'Developer',
      age: 22,
      emailVerified: true,
      plan: '100% Free Lifetime Pass',
      storageQuotaGb: 100,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    writeUsers(users);
  }

  // Create session
  const sessionToken = `ses_${crypto.randomBytes(32).toString('hex')}`;
  const sessions = readSessions();
  sessions[sessionToken] = {
    userId: user.id,
    email: user.email,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
  };
  writeSessions(sessions);

  otpStore.delete(record.registrationId);
  otpStore.delete(`email_${record.email}`);

  const publicUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    category: user.category,
    age: user.age,
    plan: user.plan || '100% Free Lifetime Pass',
    emailVerified: true,
    storageQuotaGb: user.storageQuotaGb || 100,
    createdAt: user.createdAt,
    avatar: user.avatar
  };

  return {
    success: true,
    user: publicUser,
    sessionToken,
    expiresAt: sessions[sessionToken].expiresAt,
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

  const users = readUsers();
  let user = users.find(u => u.email === normalizedEmail);

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
      storageQuotaGb: 100,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    writeUsers(users);
  } else {
    if (avatar && !user.avatar) {
      user.avatar = avatar;
      writeUsers(users);
    }
  }

  const sessionToken = `ses_${crypto.randomBytes(32).toString('hex')}`;
  const sessions = readSessions();
  sessions[sessionToken] = {
    userId: user.id,
    email: user.email,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
  };
  writeSessions(sessions);

  const publicUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    category: user.category,
    age: user.age,
    plan: user.plan,
    avatar: user.avatar,
    emailVerified: true,
    storageQuotaGb: user.storageQuotaGb,
    createdAt: user.createdAt
  };

  return {
    success: true,
    user: publicUser,
    sessionToken,
    expiresAt: sessions[sessionToken].expiresAt
  };
}

/**
 * Get User by Session Token
 */
export async function getSessionUser(sessionToken) {
  if (!sessionToken) return null;
  const sessions = readSessions();
  const session = sessions[sessionToken];

  if (!session || Date.now() > session.expiresAt) {
    if (session) {
      delete sessions[sessionToken];
      writeSessions(sessions);
    }
    return null;
  }

  const users = readUsers();
  const user = users.find(u => u.id === session.userId || u.email === session.email);
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    category: user.category,
    age: user.age,
    plan: user.plan || '100% Free Lifetime Pass',
    avatar: user.avatar,
    emailVerified: user.emailVerified ?? true,
    storageQuotaGb: user.storageQuotaGb || 100,
    createdAt: user.createdAt
  };
}

/**
 * Invalidate session token
 */
export async function destroySession(sessionToken) {
  if (!sessionToken) return;
  const sessions = readSessions();
  if (sessions[sessionToken]) {
    delete sessions[sessionToken];
    writeSessions(sessions);
  }
}
