-- Create surplus_transfers table to track transfers between hospitals
CREATE TABLE IF NOT EXISTS surplus_transfers (
  transfer_id SERIAL PRIMARY KEY,
  from_hospital_id INTEGER NOT NULL REFERENCES hospital(hospital_id),
  to_hospital_id INTEGER NOT NULL REFERENCES hospital(hospital_id),
  type VARCHAR(50) NOT NULL,
  blood_type VARCHAR(10) NOT NULL,
  rh VARCHAR(10),
  amount INTEGER NOT NULL,
  units INTEGER NOT NULL,
  transfer_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Create index on hospitals for faster queries
CREATE INDEX IF NOT EXISTS idx_surplus_transfers_from_hospital ON surplus_transfers(from_hospital_id);
CREATE INDEX IF NOT EXISTS idx_surplus_transfers_to_hospital ON surplus_transfers(to_hospital_id);
CREATE INDEX IF NOT EXISTS idx_surplus_transfers_date ON surplus_transfers(transfer_date);

-- Create surplus_thresholds table to allow customization of thresholds
CREATE TABLE IF NOT EXISTS surplus_thresholds (
  threshold_id SERIAL PRIMARY KEY,
  hospital_id INTEGER NOT NULL REFERENCES hospital(hospital_id),
  type VARCHAR(50) NOT NULL,
  critical_low INTEGER NOT NULL DEFAULT 500,
  low INTEGER NOT NULL DEFAULT 1500,
  optimal INTEGER NOT NULL DEFAULT 3000,
  surplus INTEGER NOT NULL DEFAULT 5000,
  high_surplus INTEGER NOT NULL DEFAULT 8000,
  last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on hospital_id and type
CREATE UNIQUE INDEX IF NOT EXISTS idx_surplus_thresholds_hospital_type ON surplus_thresholds(hospital_id, type);
