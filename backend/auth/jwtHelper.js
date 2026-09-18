import crypto from 'crypto';
import { AUTH_SECRET } from '../config/env.js';

/**
 * Creates an HMAC-SHA256 stateless signed token (safe across serverless restarts)
 */
export function createSignedToken(payload) {
  try {
    const jsonStr = JSON.stringify(payload);
    const base64Data = Buffer.from(jsonStr, 'utf8').toString('base64url');
    const signature = crypto.createHmac('sha256', AUTH_SECRET).update(base64Data).digest('base64url');
    return `${base64Data}.${signature}`;
  } catch (e) {
    return '';
  }
}

/**
 * Verifies and decodes an HMAC-SHA256 signed token
 */
export function verifySignedToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [base64Data, signature] = parts;
  try {
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(base64Data).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(base64Data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}
