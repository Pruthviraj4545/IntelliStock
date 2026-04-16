-- ============================================================================
-- IntelliStock Database Schema
-- ============================================================================
-- This script creates the complete database schema for the IntelliStock
-- inventory management system. Run this once during initial setup.
--
-- Usage:
--   psql -U postgres -d intellistock_db -f schema.sql
-- ============================================================================

-- ── Users Table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'customer')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- ── Products Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  category VARCHAR(100),
  brand VARCHAR(100),
  cost_price DECIMAL(10, 2) NOT NULL CHECK (cost_price >= 0),
  selling_price DECIMAL(10, 2) NOT NULL CHECK (selling_price >= 0),
  discount_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reorder_level INT DEFAULT 10 CHECK (reorder_level >= 0),
  expiry_date DATE,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Sales Table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'upi', 'wallet')),
  sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ── Notifications Table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staff', 'customer')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Indexes for Performance ──────────────────────────────────────────────
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_selling_price ON products(selling_price);
CREATE INDEX idx_products_expiry_date ON products(expiry_date);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_stock ON products(stock_quantity, reorder_level);
CREATE INDEX idx_sales_product_id ON sales(product_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_notifications_role ON notifications(role);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ============================================================================
-- Optional: Insert sample data for testing (comment out for production)
-- ============================================================================

-- INSERT INTO users (name, email, password_hash, role)
-- VALUES
--   ('Admin User', 'admin@intellistock.com', '$2b$10$...', 'admin'),
--   ('Staff User', 'staff@intellistock.com', '$2b$10$...', 'staff');
--
-- INSERT INTO products (name, category, brand, cost_price, selling_price, stock_quantity, reorder_level)
-- VALUES
--   ('Laptop', 'Electronics', 'Dell', 600.00, 999.99, 50, 10),
--   ('Mouse', 'Electronics', 'Logitech', 15.00, 29.99, 200, 50);
