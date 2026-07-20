const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const RECOVERY_CODE = process.env.ADMIN_RECOVERY_CODE;

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

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, admin: { id: admin.id, username: admin.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const result = await pool.query('SELECT * FROM admins WHERE id = $1', [req.admin.id]);
    const admin = result.rows[0];

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found.' });
    }

    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE admins SET password = $1 WHERE id = $2', [hashed, req.admin.id]);

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { recoveryCode, newPassword, username } = req.body;

    if (!recoveryCode || !newPassword || !username) {
      return res.status(400).json({ error: 'Recovery code, username, and new password are required.' });
    }

    if (!RECOVERY_CODE) {
      return res.status(500).json({ error: 'Recovery code not configured on the server.' });
    }

    const adminResult = await pool.query('SELECT id FROM admins WHERE username = $1', [username]);
    if (adminResult.rows.length === 0) {
      return res.status(404).json({ error: 'Username does not exist.' });
    }

    const recBuf = Buffer.from(recoveryCode);
    const expectedBuf = Buffer.from(RECOVERY_CODE);

    const match = recBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(recBuf, expectedBuf);

    if (!match) {
      return res.status(401).json({ error: 'Invalid recovery code.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE admins SET password = $1 WHERE username = $2', [hashed, username]);

    res.json({ message: 'Password reset successfully. You can now sign in with your new password.' });
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
