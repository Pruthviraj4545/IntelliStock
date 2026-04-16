#!/usr/bin/env node

/**
 * Initialize Notifications Table
 * Run this once to create the notifications table in PostgreSQL
 */

const pool = require("../db/db");

const initNotifications = async () => {
  try {
    console.log("🔧 Initializing notifications table...");

    // Create notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staff', 'customer')),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Notifications table created");

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(role);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
    `);

    console.log("✅ Indexes created");

    // Test insertion
    const testResult = await pool.query(
      "SELECT COUNT(*) FROM notifications"
    );

    console.log(`✅ Notifications table is ready. Current records: ${testResult.rows[0].count}`);

    process.exit(0);

  } catch (error) {
    console.error("❌ Error initializing notifications table:", error.message);
    process.exit(1);
  }
};

initNotifications();
