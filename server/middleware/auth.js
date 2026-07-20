const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const sessionResult = await pool.query(
      `SELECT s.id, s.admin_id, s.is_active, s.expires_at
       FROM sessions s
       WHERE s.token_id = $1 AND s.admin_id = $2`,
      [decoded.jti, decoded.id]
    );

    const session = sessionResult.rows[0];
    if (!session || !session.is_active) {
      return res.status(401).json({ error: 'Session expired or invalidated.', code: 'SESSION_INVALID' });
    }

    if (new Date(session.expires_at) < new Date()) {
      await pool.query('UPDATE sessions SET is_active = FALSE WHERE id = $1', [session.id]);
      return res.status(401).json({ error: 'Session expired.', code: 'SESSION_EXPIRED' });
    }

    await pool.query(
      'UPDATE sessions SET last_activity = NOW() WHERE id = $1',
      [session.id]
    );

    req.admin = { id: decoded.id, username: decoded.username, session_id: session.id };
    req.tokenId = decoded.jti;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = { authenticateToken, signAccessToken, signRefreshToken, JWT_SECRET, SESSION_MAX_AGE_MS };
