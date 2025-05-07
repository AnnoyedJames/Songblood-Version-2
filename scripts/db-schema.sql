-- This script shows the expected database schema for the application

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  hospital_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Red blood cells inventory
CREATE TABLE IF NOT EXISTS redblood_inventory (
  bag_id SERIAL PRIMARY KEY,
  donor_name VARCHAR(255) NOT NULL,
  blood_type VARCHAR(2) NOT NULL,
  rh VARCHAR(1) NOT NULL,
  amount INTEGER NOT NULL,
  donation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
  hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Plasma inventory
CREATE TABLE IF NOT EXISTS plasma_inventory (
  bag_id SERIAL PRIMARY KEY,
  donor_name VARCHAR(255) NOT NULL,
  blood_type VARCHAR(2) NOT NULL,
  amount INTEGER NOT NULL,
  donation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
  hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Platelets inventory
CREATE TABLE IF NOT EXISTS platelets_inventory (
  bag_id SERIAL PRIMARY KEY,
  donor_name VARCHAR(255) NOT NULL,
  blood_type VARCHAR(2) NOT NULL,
  rh VARCHAR(1) NOT NULL,
  amount INTEGER NOT NULL,
  donation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
  hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sample data for testing
-- Insert a test hospital
INSERT INTO hospitals (name, location) 
VALUES ('Central Hospital', 'Downtown') 
ON CONFLICT DO NOTHING;

-- Insert a test admin (username: admin, password: password123)
INSERT INTO admins (username, password_hash, hospital_id) 
VALUES ('admin', 'password123', 1) 
ON CONFLICT DO NOTHING;

-- Insert a test admin with bcrypt hash (username: secure_admin, password: password123)
INSERT INTO admins (username, password_hash, hospital_id) 
VALUES ('secure_admin', '$2a$10$JwU8S1R3a5UQQjVwbv/Y8.XKHWmS9UtbyS9YLkIZ7Kn2KqUAE7aIe', 1) 
ON CONFLICT DO NOTHING;
