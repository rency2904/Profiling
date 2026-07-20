const pool = require('./db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetPassword() {
  try {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const newPassword = process.env.ADMIN_NEW_PASSWORD || process.argv[2];

    if (!newPassword) {
      console.error('Usage: node server/reset-password.js <new-password>');
      console.error('   or: set ADMIN_NEW_PASSWORD in .env and run: npm run reset-password');
      process.exit(1);
    }

    if (newPassword.length < 6) {
      console.error('Password must be at least 6 characters.');
      process.exit(1);
    }

    const existing = await pool.query('SELECT id FROM admins WHERE username = $1', [username]);
    if (existing.rows.length === 0) {
      console.error(`Admin "${username}" not found. Run "npm run seed" first.`);
      process.exit(1);
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE admins SET password = $1 WHERE username = $2', [hashed, username]);

    console.log(`Password reset successfully for "${username}".`);
  } catch (err) {
    console.error('Reset failed:', err);
  } finally {
    await pool.end();
  }
}

resetPassword();
