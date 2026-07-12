CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  age INTEGER,
  gender VARCHAR(20) NOT NULL,
  occupation VARCHAR(100),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
