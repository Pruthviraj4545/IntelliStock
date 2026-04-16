-- Add SKU column to products table for inventory tracking
-- This enables unique product identification for CSV bulk uploads
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100) UNIQUE;

-- Create index for SKU lookups
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Add NOT NULL constraint if you want to enforce it
-- ALTER TABLE products ALTER COLUMN sku SET NOT NULL;
