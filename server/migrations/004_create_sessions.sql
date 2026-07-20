CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token_id UUID NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address VARCHAR(45),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_admin_id ON sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_id ON sessions(token_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active);
