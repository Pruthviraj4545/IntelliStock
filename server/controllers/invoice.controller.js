const logger = require("../utils/logger");
const pool = require("../db/db");

// ============================================================================
// INVOICES CONTROLLER (Billing System)
// ============================================================================

const generateInvoiceNumber = async () => {
  // Format: INV-YYYYMMDD-XXXXX
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `INV-${dateStr}-${random}`;
};

const createInvoice = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      customerId,
      items,
      subtotal,
      taxPercentage = 18,
      discountAmount = 0,
      discountPercentage = 0,
      paymentMethod = 'cash',
      notes = ''
    } = req.body;

    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invoice must contain at least one item"
      });
    }

    await client.query('BEGIN');

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Calculate totals
    let totalTax = 0;
    const processedItems = [];

    for (const item of items) {
      const { productId, quantity, rate } = item;
      const gstPercentage = taxPercentage;
      const lineTotal = quantity * rate;
      const gstAmount = (lineTotal * gstPercentage) / 100;

      processedItems.push({
        productId,
        quantity,
        rate,
        gstPercentage,
        gstAmount,
        lineTotal: lineTotal + gstAmount
      });

      totalTax += gstAmount;
    }

    const totalLineAmount = processedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const finalDiscount = discountAmount || (subtotal * discountPercentage) / 100;
    const finalTotal = totalLineAmount - finalDiscount;

    // Create invoice
    const invoiceResult = await client.query(
      `INSERT INTO invoices (invoice_number, customer_id, subtotal, tax, discount, discount_percentage, total, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [invoiceNumber, customerId || null, subtotal, totalTax, finalDiscount, discountPercentage, finalTotal, paymentMethod, notes]
    );

    const invoiceId = invoiceResult.rows[0].id;

    // Insert invoice items
    for (const item of processedItems) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, product_id, quantity, rate, gst_percentage, gst_amount, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [invoiceId, item.productId, item.quantity, item.rate, item.gstPercentage, item.gstAmount, item.lineTotal]
      );

      // Update product stock
      await client.query(
        `UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2`,
        [item.quantity, item.productId]
      );
    }

    // Update/Create customer record if customer exists
    if (customerId) {
      await client.query(
        `UPDATE customers 
         SET total_purchases = total_purchases + 1,
             total_amount_spent = total_amount_spent + $1,
             last_purchase_date = CURRENT_TIMESTAMP,
             is_frequent_customer = CASE WHEN total_purchases >= 5 THEN TRUE ELSE is_frequent_customer END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [finalTotal, customerId]
      );

      // Record interaction
      await client.query(
        `INSERT INTO customer_interactions (customer_id, interaction_type, amount)
         VALUES ($1, $2, $3)`,
        [customerId, 'purchase', finalTotal]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice: invoiceResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error("createInvoice error", { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to create invoice",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

const getInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const [invoiceResult, itemsResult, shopResult] = await Promise.all([
      pool.query(`SELECT * FROM invoices WHERE id = $1`, [invoiceId]),
      pool.query(
        `SELECT ii.*, p.name as product_name, p.sku 
         FROM invoice_items ii
         JOIN products p ON ii.product_id = p.id
         WHERE ii.invoice_id = $1`,
        [invoiceId]
      ),
      pool.query(`SELECT * FROM shop_details ORDER BY created_at DESC LIMIT 1`)
    ]);

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }

    const invoice = invoiceResult.rows[0];
    let customer = null;

    if (invoice.customer_id) {
      const customerResult = await pool.query(
        `SELECT * FROM customers WHERE id = $1`,
        [invoice.customer_id]
      );
      customer = customerResult.rows[0] || null;
    }

    res.status(200).json({
      success: true,
      invoice: {
        ...invoice,
        items: itemsResult.rows,
        customer,
        shop: shopResult.rows[0] || null
      }
    });
  } catch (error) {
    logger.error("getInvoice error", { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoice",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 20, customerId = null } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM invoices`;
    const params = [];

    if (customerId) {
      query += ` WHERE customer_id = $1`;
      params.push(customerId);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const [invoicesResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(
        customerId ? `SELECT COUNT(*) FROM invoices WHERE customer_id = $1` : `SELECT COUNT(*) FROM invoices`,
        customerId ? [customerId] : []
      )
    ]);

    res.status(200).json({
      success: true,
      invoices: invoicesResult.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    logger.error("getInvoices error", { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getLowStockAlerts = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    let query = `
      SELECT lsa.*, p.name, p.sku, p.stock_quantity, p.reorder_level
      FROM low_stock_alerts lsa
      JOIN products p ON lsa.product_id = p.id
    `;
    const params = [];

    if (status) {
      query += ` WHERE lsa.alert_status = $1`;
      params.push(status);
    }

    query += ` ORDER BY lsa.created_at DESC`;

    const result = await pool.query(query, params);

    res.status(200).json({
      success: true,
      alerts: result.rows
    });
  } catch (error) {
    logger.error("getLowStockAlerts error", { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch low stock alerts",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const acknowledgeAlert = async (req, res) => {
  try {
    const { alertId } = req.params;

    const result = await pool.query(
      `UPDATE low_stock_alerts
       SET alert_status = 'acknowledged', acknowledged_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [alertId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Alert not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Alert acknowledged",
      alert: result.rows[0]
    });
  } catch (error) {
    logger.error("acknowledgeAlert error", { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to acknowledge alert",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createInvoice,
  getInvoice,
  getInvoices,
  getLowStockAlerts,
  acknowledgeAlert
};
