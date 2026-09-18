import crypto from 'crypto';

/**
 * PBKDF2 Password Hashing
 */
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

/**
 * PBKDF2 Password Verification
 */
export function verifyPassword(password, salt, storedHash) {
  if (!password || !salt || !storedHash) return false;
  const hash = crypto.pbkdf2Sync(String(password), salt, 10000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

/**
 * Generate cryptographically secure 6-digit OTP
 */
export function generateCryptoOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash OTP code with HMAC-SHA256
 */
export function hashOtp(otp, salt) {
  return crypto.createHmac('sha256', salt).update(String(otp).trim()).digest('hex');
}
