import { getSessionUser } from './authService.js';

/**
 * Extracts session token from Authorization Header, Cookies, or Query
 */
export function extractSessionToken(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  const cookieHeader = req.headers['cookie'];
  if (cookieHeader) {
    const match = cookieHeader.match(/omni_session=([^;]+)/);
    if (match) return match[1].trim();
  }

  if (req.query && req.query.sessionToken) {
    return String(req.query.sessionToken).trim();
  }

  return null;
}

/**
 * Middleware: Attach authenticated user if valid session exists
 */
export async function optionalAuth(req, res, next) {
  try {
    const token = extractSessionToken(req);
    if (token) {
      const user = await getSessionUser(token);
      if (user) {
        req.user = user;
        req.sessionToken = token;
      }
    }
  } catch (err) {
    console.warn('[optionalAuth] Warning:', err.message);
  }
  next();
}

/**
 * Middleware: Require active authentication
 */
export async function requireAuth(req, res, next) {
  try {
    const token = extractSessionToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
    }

    const user = await getSessionUser(token);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired session. Please log in again.' });
    }

    req.user = user;
    req.sessionToken = token;
    next();
  } catch (err) {
    console.error('[requireAuth] Error:', err.message);
    return res.status(500).json({ success: false, error: 'Authentication verification failed.' });
  }
}
