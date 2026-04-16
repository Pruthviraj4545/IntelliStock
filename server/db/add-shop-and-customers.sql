-- ============================================================================
-- IntelliStock Database Migration: Add Shop & Customer Management
-- ============================================================================
-- This migration adds tables for shop details and customer tracking
-- Run this after the main schema.sql
--
-- Usage:
--   psql -U postgres -d intellistock_db -f add-shop-and-customers.sql
-- ============================================================================

-- ── Shop Details Table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_details (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  contact_number VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  gst_number VARCHAR(50) NOT NULL UNIQUE,
  pan_number VARCHAR(50),
  business_type VARCHAR(100),
  logo_url VARCHAR(500),
  website VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Customers Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255),
  address VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  total_purchases INT DEFAULT 0,
  total_amount_spent DECIMAL(12, 2) DEFAULT 0,
  loyalty_points INT DEFAULT 0,
  is_frequent_customer BOOLEAN DEFAULT FALSE,
  first_purchase_date TIMESTAMP,
  last_purchase_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Customer Interactions Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_interactions (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL,
  interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('purchase', 'return', 'inquiry', 'feedback')),
  details TEXT,
  amount DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- ── Invoices Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id INT,
  subtotal DECIMAL(12, 2) NOT NULL,
  tax DECIMAL(12, 2) NOT NULL,
  discount DECIMAL(12, 2) DEFAULT 0,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'upi', 'wallet', 'cheque')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- ── Invoice Items Table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  rate DECIMAL(12, 2) NOT NULL,
  gst_percentage DECIMAL(5, 2) DEFAULT 18,
  gst_amount DECIMAL(12, 2),
  total DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- ── Loyalty Programs Table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_programs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  purchase_threshold DECIMAL(12, 2),
  discount_percentage DECIMAL(5, 2) NOT NULL,
  loyalty_points_per_rupee DECIMAL(5, 2) DEFAULT 0.01,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Low Stock Alerts Table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS low_stock_alerts (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL,
  alert_status VARCHAR(20) DEFAULT 'pending' CHECK (alert_status IN ('pending', 'acknowledged', 'resolved')),
  current_stock INT,
  reorder_level INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ── Indexes for Performance ──────────────────────────────────────────────
CREATE INDEX idx_customers_mobile ON customers(mobile_number);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_is_frequent ON customers(is_frequent_customer);
CREATE INDEX idx_customer_interactions_customer_id ON customer_interactions(customer_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_low_stock_alerts_product_id ON low_stock_alerts(product_id);
CREATE INDEX idx_low_stock_alerts_status ON low_stock_alerts(alert_status);

-- ============================================================================
-- Optional: Insert sample shop details (update with actual data)
-- ============================================================================
-- INSERT INTO shop_details (name, address, city, state, postal_code, contact_number, email, gst_number, business_type)
-- VALUES (
--   'IntelliStock Store',
--   '123 Business Street',
--   'Bangalore',
--   'Karnataka',
--   '560001',
--   '+91-9876543210',
--   'store@intellistock.com',
--   '18ABCDE1234F2Z5',
--   'Retail'
-- );
