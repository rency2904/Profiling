const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function migrate() {
  try {
    const sql1 = fs.readFileSync(
      path.join(__dirname, 'migrations', '001_create_profiles.sql'),
      'utf-8'
    );
    await pool.query(sql1);
    console.log('Migration 1 completed: profiles table created');

    const sql2 = fs.readFileSync(
      path.join(__dirname, 'migrations', '002_drop_unused_columns.sql'),
      'utf-8'
    );
    await pool.query(sql2);
    console.log('Migration 2 completed: unused columns dropped');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
