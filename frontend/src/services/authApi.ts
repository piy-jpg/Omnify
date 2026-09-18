/**
 * Frontend Auth API Client
 * Connects directly to backend server for live Email OTP delivery & password authentication.
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  category: string;
  age: number;
  plan: string;
  emailVerified: boolean;
  phoneVerified?: boolean;
  createdAt: string;
  storageQuotaGb: number;
}

export interface RegisterPayload {
  name: string;
  email: string;
  category: string;
  age: number;
  phone?: string;
}

export interface OtpResponse {
  success: boolean;
  registrationId?: string;
  identifier?: string;
  email?: string;
  phone?: string;
  maskedIdentifier?: string;
  maskedEmail?: string;
  maskedPhone?: string;
  isExistingUser?: boolean;
  resendCooldown: number;
  expiresIn: number;
  tempToken?: string;
  devOtp?: string;
  message?: string;
  error?: string;
}

export interface VerifyRegisterResponse {
  success: boolean;
  verified: boolean;
  registrationId?: string;
  email: string;
  tempToken?: string;
  message?: string;
  error?: string;
}

export interface VerifyResponse {
  success: boolean;
  user: AuthUser;
  sessionToken: string;
  expiresAt: number;
  error?: string;
}

const AUTH_TOKEN_KEY = 'omni_auth_token';
const AUTH_USER_KEY = 'omni_auth_user';

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredAuth(token: string, user: AuthUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.clear();
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(AUTH_USER_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

/**
 * Step 1: Register - Submit details & dispatch Email OTP via real backend
 */
export async function apiRegister(payload: RegisterPayload): Promise<OtpResponse> {
  const res = await fetch('/api/auth/register-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  let data: any = {};
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('Backend server returned unexpected response. Please make sure server is running.');
  }

  if (!res.ok || !data.success) {
    throw new Error(data.error || data.message || 'Failed to dispatch verification email.');
  }
  return data;
}

/**
 * Step 2: Verify Registration OTP
 */
export async function apiVerifyRegisterOtp(emailOrRegId: string, otp: string, registrationId?: string): Promise<VerifyRegisterResponse> {
  const res = await fetch('/api/auth/verify-register-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      registrationId: registrationId || (emailOrRegId.startsWith('reg_') ? emailOrRegId : undefined),
      email: !emailOrRegId.startsWith('reg_') ? emailOrRegId : undefined, 
      otp 
    })
  });
  
  let data: any = {};
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('Backend server returned unexpected response. Please make sure server is running.');
  }

  if (!res.ok || !data.success) {
    throw new Error(data.error || data.message || 'Invalid or expired verification code.');
  }
  return data;
}

/**
 * Step 3: Complete Registration by creating Password
 */
export async function apiCompleteRegistration(email: string, password: string, tempToken?: string, registrationId?: string): Promise<VerifyResponse> {
  const res = await fetch('/api/auth/complete-registration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registrationId, email, password, tempToken })
  });
  
  let data: any = {};
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('Backend server returned unexpected response.');
  }

  if (!res.ok || !data.success) {
    throw new Error(data.error || data.message || 'Failed to complete registration.');
  }
  return data;
}

/**
 * Login with Email & Password
 */
export async function apiLoginPassword(email: string, password: string): Promise<VerifyResponse> {
  const res = await fetch('/api/auth/login-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  let data: any = {};
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('Backend server returned unexpected response.');
  }

  if (!res.ok || !data.success) {
    throw new Error(data.error || data.message || 'Login failed. Check your email or password.');
  }
  return data;
}

/**
 * Login & dispatch Email OTP (Passwordless alternative)
 */
export async function apiLoginOtp(identifier: string): Promise<OtpResponse> {
  const res = await fetch('/api/auth/login-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      identifier,
      email: identifier.includes('@') ? identifier : undefined,
      phone: !identifier.includes('@') ? identifier : undefined
    })
  });
  
  let data: any = {};
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('Backend server returned unexpected response.');
  }

  if (!res.ok || !data.success) {
    throw new Error(data.error || data.message || 'Failed to send verification code.');
  }
  return data;
}

/**
 * Verify 6-digit OTP (Passwordless)
 */
export async function apiVerifyOtp(identifier: string, otp: string, registrationId?: string): Promise<VerifyResponse> {
  const res = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      registrationId,
      identifier,
      email: identifier.includes('@') ? identifier : undefined,
      phone: !identifier.includes('@') ? identifier : undefined,
      otp 
    })
  });
  
  let data: any = {};
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('Backend server returned unexpected response.');
  }

  if (!res.ok || !data.success) {
    throw new Error(data.error || data.message || 'Invalid or expired verification code.');
  }
  return data;
}

/**
 * Resend OTP
 */
export async function apiResendOtp(identifier: string, registrationId?: string): Promise<OtpResponse> {
  const res = await fetch('/api/auth/resend-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      registrationId,
      identifier,
      email: identifier.includes('@') ? identifier : undefined,
      phone: !identifier.includes('@') ? identifier : undefined
    })
  });
  
  let data: any = {};
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('Backend server returned unexpected response.');
  }

  if (!res.ok || !data.success) {
    throw new Error(data.error || data.message || 'Failed to resend verification code.');
  }
  return data;
}

/**
 * Google One-Tap & OAuth Login
 */
export async function apiGoogleLogin(payload: { email: string; name?: string; avatar?: string; credential?: string }): Promise<VerifyResponse> {
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  let data: any = {};
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('Backend server returned unexpected response.');
  }

  if (!res.ok || !data.success) {
    throw new Error(data.error || data.message || 'Google authentication failed.');
  }

  setStoredAuth(data.sessionToken, data.user);
  return data;
}

/**
 * Fetch Current Session User
 */
export async function apiGetMe(): Promise<AuthUser | null> {
  const token = getStoredAuthToken();
  try {
    const res = await fetch('/api/auth/me', {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success && data.user ? data.user : null;
  } catch (err) {
    return null;
  }
}

/**
 * Logout
 */
export async function apiLogout(): Promise<void> {
  const token = getStoredAuthToken();
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
  } catch (err) {
    console.error('[Auth Client] Logout API error:', err);
  } finally {
    clearStoredAuth();
  }
}
