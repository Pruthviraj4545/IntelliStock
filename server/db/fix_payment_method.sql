-- Fix missing payment_method column in sales table
-- Run this script to add the column if it doesn't exist

ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'upi', 'wallet'));

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'sales' AND column_name = 'payment_method';
