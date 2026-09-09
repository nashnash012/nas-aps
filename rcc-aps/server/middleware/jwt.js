'use strict';
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'rcc-aps-secret-key-change-in-production';

/**
 * Express middleware that verifies the JWT Bearer token on every request.
 * On success, attaches req.user = { id, email, role, label, page, status }.
 * On failure, responds 401 Unauthorized.
 */
function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, error: 'No token provided. Please log in.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;   // { id, email, role, label, page, status }
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ ok: false, error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ ok: false, error: 'Invalid token. Please log in again.' });
  }
}

/**
 * Optional auth middleware — the same verification as requireAuth, but if no
 * Bearer token is supplied the request continues as anonymous. Used so the
 * original (pre-JWT) frontend keeps working on /api/* while any request that
 * DOES carry a token is still strictly validated.
 * On success with a token, attaches req.user (same shape as requireAuth).
 * On a present-but-invalid token, responds 401.
 */
function optionalAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;   // { id, email, role, label, page, status }
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ ok: false, error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ ok: false, error: 'Invalid token. Please log in again.' });
  }
}

/**
 * Role guard factory — use after requireAuth.
 * e.g. requireRole('admin') or requireRole('admin','finance')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ ok: false, error: 'Not authenticated.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: 'Access denied. Insufficient role.' });
    }
    next();
  };
}

module.exports = { requireAuth, optionalAuth, requireRole, JWT_SECRET };
