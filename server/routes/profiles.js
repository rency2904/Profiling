const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { q, gender, min_age, max_age } = req.query;

    if (q) {
      const result = await pool.query(
        `SELECT * FROM profiles
         WHERE first_name ILIKE $1 OR last_name ILIKE $1
            OR occupation ILIKE $1
            OR barangay_name ILIKE $1
            OR city_name ILIKE $1
            OR province_name ILIKE $1
         ORDER BY created_at DESC`,
        [`%${q}%`]
      );
      return res.json(result.rows);
    }

    let query = 'SELECT * FROM profiles WHERE 1=1';
    const params = [];
    let idx = 1;

    if (gender) {
      query += ` AND gender = $${idx++}`;
      params.push(gender);
    }
    if (min_age) {
      query += ` AND age >= $${idx++}`;
      params.push(parseInt(min_age));
    }
    if (max_age) {
      query += ` AND age <= $${idx++}`;
      params.push(parseInt(max_age));
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE gender = 'Male')::int AS male,
        COUNT(*) FILTER (WHERE gender = 'Female')::int AS female,
        ROUND(AVG(age))::int AS average_age,
        MIN(age)::int AS youngest_age,
        MAX(age)::int AS oldest_age
      FROM profiles
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      first_name, last_name, age, gender, occupation,
      province_code, province_name, city_code, city_name,
      barangay_code, barangay_name, purok
    } = req.body;

    const address = [purok, barangay_name, city_name, province_name]
      .filter(Boolean).join(', ');

    const result = await pool.query(
      `INSERT INTO profiles
        (first_name, last_name, age, gender, occupation, address,
         province_code, province_name, city_code, city_name,
         barangay_code, barangay_name, purok)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [first_name, last_name, age, gender, occupation, address,
       province_code, province_name, city_code, city_name,
       barangay_code, barangay_name, purok]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name, last_name, age, gender, occupation,
      province_code, province_name, city_code, city_name,
      barangay_code, barangay_name, purok
    } = req.body;

    const address = [purok, barangay_name, city_name, province_name]
      .filter(Boolean).join(', ');

    const result = await pool.query(
      `UPDATE profiles SET
        first_name = $1, last_name = $2, age = $3,
        gender = $4, occupation = $5, address = $6,
        province_code = $7, province_name = $8,
        city_code = $9, city_name = $10,
        barangay_code = $11, barangay_name = $12,
        purok = $13,
        updated_at = NOW()
       WHERE id = $14
       RETURNING *`,
      [first_name, last_name, age, gender, occupation, address,
       province_code, province_name, city_code, city_name,
       barangay_code, barangay_name, purok, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM profiles WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json({ message: 'Profile deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
