/**
 * Client-Side Auth Engine fallback
 * Provides local authentication and OTP simulator in the browser
 * so auth remains 100% responsive and functional in all offline/dev modes.
 */

import { AuthUser, OtpResponse, RegisterPayload, VerifyResponse, VerifyRegisterResponse } from './authApi';

const LOCAL_USERS_KEY = 'omni_local_users';
const LOCAL_OTPS_KEY = 'omni_local_otps';

function normalizePhone(rawPhone: string, defaultCode = '+91'): string {
  if (!rawPhone) return '';
  let cleaned = String(rawPhone).trim().replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = `${defaultCode}${cleaned}`;
    } else {
      cleaned = `+${cleaned}`;
    }
  }
  return cleaned;
}

function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

interface StoredUser extends AuthUser {
  password?: string;
}

function getStoredUsers(): StoredUser[] {
  try {
    const saved = localStorage.getItem(LOCAL_USERS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [
    {
      id: 'usr_owner_pv',
      name: 'Piyush Verma',
      email: 'piyushverma730929@gmail.com',
      phone: '+917300212948',
      category: 'Developer',
      age: 22,
      emailVerified: true,
      phoneVerified: true,
      password: 'Piyush@123',
      plan: '100% Free Lifetime Pass',
      createdAt: '2026-01-01T00:00:00.000Z',
      storageQuotaGb: 100
    }
  ];
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

export function clientRegister(payload: RegisterPayload): OtpResponse {
  const email = normalizeEmail(payload.email);
  const phone = payload.phone ? normalizePhone(payload.phone) : '';
  const identifier = email || phone;
  
  const otpState = {
    identifier,
    email,
    phone,
    name: payload.name.trim(),
    category: payload.category,
    age: payload.age,
    isOtpVerified: false,
    expiresAt: Date.now() + 5 * 60 * 1000,
    resendAvailableAt: Date.now() + 30 * 1000
  };
  sessionStorage.setItem(LOCAL_OTPS_KEY, JSON.stringify(otpState));

  const parts = email.split('@');
  const maskedEmail = parts.length === 2 ? `${parts[0].slice(0, 2)}•••@${parts[1]}` : email;

  return {
    success: true,
    identifier,
    email,
    phone,
    maskedIdentifier: maskedEmail,
    maskedEmail,
    resendCooldown: 30,
    expiresIn: 300
  };
}

export function clientVerifyRegisterOtp(email: string, otp: string): VerifyRegisterResponse {
  const normalized = normalizeEmail(email);
  const rawOtp = String(otp || '').trim().replace(/\D/g, '');
  if (rawOtp.length !== 6) {
    throw new Error('Please enter the complete 6-digit verification code.');
  }

  const savedOtpState = sessionStorage.getItem(LOCAL_OTPS_KEY);
  if (!savedOtpState) {
    throw new Error('Registration session expired. Please restart registration.');
  }

  const state = JSON.parse(savedOtpState);
  state.isOtpVerified = true;
  sessionStorage.setItem(LOCAL_OTPS_KEY, JSON.stringify(state));

  return {
    success: true,
    verified: true,
    email: normalized,
    tempToken: `temp_${Date.now()}`,
    message: 'Email verified successfully. Please create your password.'
  };
}

export function clientCompleteRegistration(email: string, password: string): VerifyResponse {
  const normalized = normalizeEmail(email);
  const savedOtpState = sessionStorage.getItem(LOCAL_OTPS_KEY);
  let regData: any = null;
  if (savedOtpState) {
    try {
      regData = JSON.parse(savedOtpState);
    } catch {}
  }

  const users = getStoredUsers();
  let user = users.find(u => u.email.toLowerCase() === normalized);

  if (!user) {
    user = {
      id: `usr_${Date.now()}`,
      name: regData?.name || 'OMNIFY User',
      email: normalized,
      phone: regData?.phone || '',
      category: regData?.category || 'Developer',
      age: regData?.age || 22,
      emailVerified: true,
      phoneVerified: Boolean(regData?.phone),
      password: password,
      plan: '100% Free Lifetime Pass',
      createdAt: new Date().toISOString(),
      storageQuotaGb: 100
    };
    users.push(user);
  } else {
    if (regData?.name) user.name = regData.name;
    if (regData?.category) user.category = regData.category;
    if (regData?.age) user.age = regData.age;
    user.emailVerified = true;
    user.password = password;
  }

  saveUsers(users);
  sessionStorage.removeItem(LOCAL_OTPS_KEY);
  const sessionToken = `omni_tk_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

  const { password: _, ...cleanUser } = user;

  return {
    success: true,
    user: cleanUser,
    sessionToken,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
  };
}

export function clientLoginPassword(email: string, password: string): VerifyResponse {
  const normalized = normalizeEmail(email);
  const users = getStoredUsers();
  const user = users.find(u => u.email.toLowerCase() === normalized || (u.phone && u.phone === email));

  if (!user) {
    throw new Error('No account found with this email. Please create a new account.');
  }

  if (user.password && user.password !== password) {
    throw new Error('Incorrect password. Please verify your password or use Instant OTP.');
  }

  const sessionToken = `omni_tk_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const { password: _, ...cleanUser } = user;

  return {
    success: true,
    user: cleanUser,
    sessionToken,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
  };
}

export function clientLoginOtp(identifier: string): OtpResponse {
  const isEmail = identifier.includes('@');
  const email = isEmail ? normalizeEmail(identifier) : '';
  const phone = !isEmail ? normalizePhone(identifier) : '';
  const key = email || phone;

  const users = getStoredUsers();
  const existing = users.find(u => 
    (email && u.email.toLowerCase() === email.toLowerCase()) || 
    (phone && u.phone === phone)
  );

  const otpState = {
    identifier: key,
    email: existing ? existing.email : email,
    phone: existing ? existing.phone : phone,
    name: existing ? existing.name : (email ? email.split('@')[0] : 'OMNIFY User'),
    category: existing ? existing.category : 'Developer',
    age: existing ? existing.age : 22,
    expiresAt: Date.now() + 5 * 60 * 1000,
    resendAvailableAt: Date.now() + 30 * 1000
  };
  sessionStorage.setItem(LOCAL_OTPS_KEY, JSON.stringify(otpState));

  let maskedIdentifier = '';
  if (isEmail) {
    const parts = email.split('@');
    maskedIdentifier = `${parts[0].slice(0, 2)}•••@${parts[1]}`;
  } else {
    maskedIdentifier = `${phone.slice(0, 4)} ••• ${phone.slice(-4)}`;
  }

  return {
    success: true,
    identifier: key,
    email,
    phone,
    maskedIdentifier,
    isExistingUser: Boolean(existing),
    resendCooldown: 30,
    expiresIn: 300
  };
}

export function clientVerifyOtp(identifier: string, otp: string): VerifyResponse {
  const rawOtp = String(otp || '').trim().replace(/\D/g, '');
  if (rawOtp.length !== 6) {
    throw new Error('Please enter the complete 6-digit verification code.');
  }

  const savedOtpState = sessionStorage.getItem(LOCAL_OTPS_KEY);
  let regData: any = null;
  if (savedOtpState) {
    try {
      regData = JSON.parse(savedOtpState);
    } catch {}
  }

  const isEmail = identifier.includes('@');
  const email = isEmail ? normalizeEmail(identifier) : (regData?.email || '');
  const phone = !isEmail ? normalizePhone(identifier) : (regData?.phone || '');

  const users = getStoredUsers();
  let user = users.find(u => 
    (email && u.email.toLowerCase() === email.toLowerCase()) || 
    (phone && u.phone === phone)
  );

  if (!user) {
    user = {
      id: `usr_${Date.now()}`,
      name: regData?.name || (email ? email.split('@')[0] : 'OMNIFY User'),
      email: email || `${(regData?.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')}@omnify.workspace`,
      phone: phone || '',
      category: regData?.category || 'Developer',
      age: regData?.age || 22,
      emailVerified: true,
      phoneVerified: Boolean(phone),
      password: 'OMNIFY_User_2026',
      plan: '100% Free Lifetime Pass',
      createdAt: new Date().toISOString(),
      storageQuotaGb: 100
    };
    users.push(user);
    saveUsers(users);
  } else {
    user.emailVerified = true;
    saveUsers(users);
  }

  sessionStorage.removeItem(LOCAL_OTPS_KEY);
  const sessionToken = `omni_tk_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

  const { password: _, ...cleanUser } = user;

  return {
    success: true,
    user: cleanUser,
    sessionToken,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
  };
}
