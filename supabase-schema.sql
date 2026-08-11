-- Temp Mail System Database Schema
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_authorized BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mailboxes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emails (
  id SERIAL PRIMARY KEY,
  mailbox_id INTEGER REFERENCES mailboxes(id) ON DELETE CASCADE,
  from_address VARCHAR(255),
  to_address VARCHAR(100),
  subject VARCHAR(500),
  body_text TEXT,
  body_html TEXT,
  headers JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mailboxes_email ON mailboxes(email);
CREATE INDEX IF NOT EXISTS idx_mailboxes_user ON mailboxes(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_mailbox ON emails(mailbox_id);
CREATE INDEX IF NOT EXISTS idx_emails_created ON emails(created_at DESC);

-- Create default admin user (password: admin123)
INSERT INTO users (username, password_hash, is_authorized, is_admin)
VALUES ('admin', '$2b$10$EpRnT5JbV0qDhvmBjPDAH.0CMfqH8qQuDrfkzXKCCBA5flkXxI6ne', true, true)
ON CONFLICT (username) DO NOTHING;
