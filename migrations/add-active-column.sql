-- Add active column to redblood_inventory table
ALTER TABLE redblood_inventory 
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Add active column to plasma_inventory table
ALTER TABLE plasma_inventory 
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Add active column to platelets_inventory table
ALTER TABLE platelets_inventory 
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Create indexes for faster filtering by active status
CREATE INDEX IF NOT EXISTS idx_redblood_active ON redblood_inventory(active);
CREATE INDEX IF NOT EXISTS idx_plasma_active ON plasma_inventory(active);
CREATE INDEX IF NOT EXISTS idx_platelets_active ON platelets_inventory(active);

-- Update any existing entries to be active
UPDATE redblood_inventory SET active = true WHERE active IS NULL;
UPDATE plasma_inventory SET active = true WHERE active IS NULL;
UPDATE platelets_inventory SET active = true WHERE active IS NULL;
