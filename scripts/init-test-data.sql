-- Script to initialize test data for debugging login issues

-- Check if hospitals table exists, create if not
CREATE TABLE IF NOT EXISTS hospitals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Check if admins table exists, create if not
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  hospital_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Check if admin_sessions table exists, create if not
CREATE TABLE IF NOT EXISTS admin_sessions (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert a test hospital if none exists
INSERT INTO hospitals (name, location)
SELECT 'Central Hospital', 'Downtown'
WHERE NOT EXISTS (SELECT 1 FROM hospitals LIMIT 1);

-- Insert a test admin with plain text password if none exists
INSERT INTO admins (username, password_hash, hospital_id)
SELECT 'admin', 'password123', 1
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE username = 'admin');

-- Insert a test admin with bcrypt hashed password
-- The password is 'secure123'
INSERT INTO admins (username, password_hash, hospital_id)
SELECT 'secure_admin', '$2a$10$JwU8S1R3a5UQQjVwbv/Y8.XKHWmS9UtbyS9YLkIZ7Kn2KqUAE7aIe', 1
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE username = 'secure_admin');

-- Log the results
SELECT 'Database initialized with test data' as result;
SELECT COUNT(*) as hospitals_count FROM hospitals;
SELECT COUNT(*) as admins_count FROM admins;
SELECT id, username, hospital_id FROM admins;
