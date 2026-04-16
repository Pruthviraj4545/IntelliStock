const { Pool } = require("pg");
require("dotenv").config();

const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number.isNaN(dbPort) ? 5432 : dbPort,
  database: process.env.DB_NAME,
});

const ensureShopDetailsTable = async () => {
  await pool.query(`
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
    )
  `);
};

const ensureSalesTransactionColumn = async () => {
  await pool.query(`
    ALTER TABLE sales
    ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(80)
  `);
};

pool.ensureShopDetailsTable = ensureShopDetailsTable;
pool.ensureSalesTransactionColumn = ensureSalesTransactionColumn;

pool.connect()
  .then(() => console.log("PostgreSQL Connected Successfully ✅"))
  .catch(err => console.error("PostgreSQL Connection Error ❌", err));

module.exports = pool;