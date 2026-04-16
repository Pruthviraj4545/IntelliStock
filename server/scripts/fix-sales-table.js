const pool = require('../db/db');

async function fixSalesTable() {
  try {
    console.log('Checking sales table schema...');

    // Check if payment_method column exists
    const columnCheck = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'payment_method'"
    );

    if (columnCheck.rows.length === 0) {
      console.log('payment_method column not found. Adding it...');

      await pool.query(`
        ALTER TABLE sales
        ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash'
          CHECK (payment_method IN ('cash', 'card', 'upi', 'wallet'))
      `);

      console.log('✅ payment_method column added successfully!');
    } else {
      console.log('✅ payment_method column already exists');
    }

    // Show current table structure
    const result = await pool.query(
      "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'sales' ORDER BY ordinal_position"
    );

    console.log('\nCurrent sales table columns:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.column_default ? 'DEFAULT ' + col.column_default : ''}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixSalesTable();
