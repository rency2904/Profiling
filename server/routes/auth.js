const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../db');
const { authenticateToken, signAccessToken, signRefreshToken, SESSION_MAX_AGE_MS } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    const admin = result.rows[0];

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const tokenId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

    const sessionResult = await pool.query(
      `INSERT INTO sessions (admin_id, token_id, user_agent, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        admin.id,
        tokenId,
        req.headers['user-agent'] || null,
        req.ip || req.connection?.remoteAddress || null,
        expiresAt,
      ]
    );

    const accessToken = signAccessToken({
      id: admin.id,
      username: admin.username,
      jti: tokenId,
    });

    const refreshToken = signRefreshToken({
      id: admin.id,
      username: admin.username,
      jti: tokenId,
    });

    res.json({
      token: accessToken,
      refreshToken,
      expiresAt: expiresAt.toISOString(),
      admin: { id: admin.id, username: admin.username },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }

    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../middleware/auth');

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token.', code: 'TOKEN_EXPIRED' });
    }

    const sessionResult = await pool.query(
      `SELECT s.id, s.is_active, s.expires_at
       FROM sessions s
       WHERE s.token_id = $1 AND s.admin_id = $2`,
      [decoded.jti, decoded.id]
    );

    const session = sessionResult.rows[0];
    if (!session || !session.is_active) {
      return res.status(401).json({ error: 'Session no longer active.', code: 'SESSION_INVALID' });
    }

    if (new Date(session.expires_at) < new Date()) {
      await pool.query('UPDATE sessions SET is_active = FALSE WHERE id = $1', [session.id]);
      return res.status(401).json({ error: 'Session expired.', code: 'SESSION_EXPIRED' });
    }

    const adminResult = await pool.query('SELECT id, username FROM admins WHERE id = $1', [decoded.id]);
    if (adminResult.rows.length === 0) {
      return res.status(401).json({ error: 'Admin not found.' });
    }

    const admin = adminResult.rows[0];

    const newTokenId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

    await pool.query(
      `UPDATE sessions SET token_id = $1, expires_at = $2, last_activity = NOW()
       WHERE id = $3`,
      [newTokenId, expiresAt, session.id]
    );

    const accessToken = signAccessToken({
      id: admin.id,
      username: admin.username,
      jti: newTokenId,
    });

    const newRefreshToken = signRefreshToken({
      id: admin.id,
      username: admin.username,
      jti: newTokenId,
    });

    res.json({
      token: accessToken,
      refreshToken: newRefreshToken,
      expiresAt: expiresAt.toISOString(),
      admin: { id: admin.id, username: admin.username },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE sessions SET is_active = FALSE WHERE id = $1',
      [req.admin.session_id]
    );
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE sessions SET is_active = FALSE WHERE admin_id = $1 AND id != $2',
      [req.admin.id, req.admin.session_id]
    );
    res.json({ message: 'Other sessions logged out.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, token_id, user_agent, ip_address, is_active,
              created_at, expires_at, last_activity
       FROM sessions
       WHERE admin_id = $1
       ORDER BY last_activity DESC`,
      [req.admin.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, created_at FROM admins WHERE id = $1',
      [req.admin.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
