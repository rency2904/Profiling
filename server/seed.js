const pool = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    const existing = await pool.query('SELECT id FROM admins WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      console.log('Admin already exists, skipping seed.');
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO admins (username, password) VALUES ($1, $2)',
      [username, hashed]
    );
    console.log(`Admin seeded: username="${username}"`);
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await pool.end();
  }
}

seed();
