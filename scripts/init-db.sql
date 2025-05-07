-- Database initialization script for production

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

-- Insert initial data (only if tables are empty)

-- Insert a hospital if none exists
INSERT INTO hospitals (name, location)
SELECT 'Central Hospital', 'Downtown'
WHERE NOT EXISTS (SELECT 1 FROM hospitals LIMIT 1);

-- Insert an admin if none exists (username: admin, password: password123)
INSERT INTO admins (username, password_hash, hospital_id)
SELECT 'admin', 'password123', 1
WHERE NOT EXISTS (SELECT 1 FROM admins LIMIT 1);

-- Insert sample data for testing
-- Red blood cells
INSERT INTO redblood_inventory (donor_name, blood_type, rh, amount, expiration_date, hospital_id)
SELECT 'John Doe', 'A', '+', 450, CURRENT_DATE + INTERVAL '35 days', 1
WHERE NOT EXISTS (SELECT 1 FROM redblood_inventory LIMIT 1);

INSERT INTO redblood_inventory (donor_name, blood_type, rh, amount, expiration_date, hospital_id)
SELECT 'Jane Smith', 'O', '-', 400, CURRENT_DATE + INTERVAL '30 days', 1
WHERE NOT EXISTS (SELECT 1 FROM redblood_inventory LIMIT 1);

-- Plasma
INSERT INTO plasma_inventory (donor_name, blood_type, amount, expiration_date, hospital_id)
SELECT 'Robert Johnson', 'AB', 300, CURRENT_DATE + INTERVAL '365 days', 1
WHERE NOT EXISTS (SELECT 1 FROM plasma_inventory LIMIT 1);

-- Platelets
INSERT INTO platelets_inventory (donor_name, blood_type, rh, amount, expiration_date, hospital_id)
SELECT 'Sarah Williams', 'B', '+', 250, CURRENT_DATE + INTERVAL '5 days', 1
WHERE NOT EXISTS (SELECT 1 FROM platelets_inventory LIMIT 1);
