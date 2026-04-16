const pool = require("../db/db");
const { createNotification } = require("../utils/notification.helper");
const logger = require("../utils/logger");

const createSale = async (req, res) => {
  const client = await pool.connect();

  try {
    const { product_id, quantity, payment_method = 'cash', transaction_id } = req.body;
    const qty = parseInt(quantity, 10);
    const saleTransactionId =
      typeof transaction_id === 'string' && transaction_id.trim()
        ? transaction_id.trim()
        : `SALE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (!product_id || !qty || qty <= 0) {
      return res.status(400).json({ success: false, message: "Valid product_id and quantity (> 0) are required" });
    }

    await client.query("BEGIN");

    const productResult = await client.query(
      "SELECT * FROM products WHERE id = $1 FOR UPDATE",
      [product_id]
    );

    if (productResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const product = productResult.rows[0];

    if (product.stock_quantity < qty) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Insufficient stock" });
    }

    const totalAmount = parseFloat(product.selling_price) * qty;

    await client.query(
      "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
      [qty, product_id]
    );

    const saleResult = await client.query(
      "INSERT INTO sales (product_id, quantity, total_amount, payment_method, transaction_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [product_id, qty, totalAmount, payment_method, saleTransactionId]
    );

    const updatedProductResult = await client.query(
      "SELECT stock_quantity, reorder_level, name FROM products WHERE id = $1",
      [product_id]
    );

    const updatedProduct = updatedProductResult.rows[0];
    const { stock_quantity: updatedStock, reorder_level, name: productName } = updatedProduct;

    if (updatedStock <= reorder_level) {
      await createNotification(
        `Low stock alert: '${productName}' has only ${updatedStock} units remaining. Reorder level is ${reorder_level}.`,
        "staff"
      );
    }

    const averageResult = await client.query(
      "SELECT AVG(quantity) AS avg_quantity FROM sales WHERE product_id = $1",
      [product_id]
    );
    const avgQuantity = parseFloat(averageResult.rows[0].avg_quantity) || 0;
    const spikeThreshold = Math.max(10, Math.ceil(avgQuantity * 2));

    if (qty >= spikeThreshold) {
      await createNotification(
        `Large sale spike detected for '${productName}': ${qty} units sold in a single transaction.`,
        "admin"
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Sale completed successfully",
      sale: saleResult.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");
    logger.error('createSale error', {
      message: error.message,
      stack: error.stack,
      product_id: req.body.product_id,
      quantity: req.body.quantity,
      userId: req.user?.id
    });
    res.status(500).json({ success: false, message: "Server error", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  } finally {
    client.release();
  }
};

const getSales = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const grouped = req.query.grouped === 'true';

    let dataResult;
    let countResult;

    if (grouped) {
      [dataResult, countResult] = await Promise.all([
        pool.query(
          `SELECT
             COALESCE(s.transaction_id, 'SALE-' || s.id::text) AS transaction_id,
             MAX(s.id) AS id,
             SUM(s.quantity)::INT AS quantity,
             COALESCE(SUM(s.total_amount), 0) AS total_amount,
             MAX(s.sale_date) AS sale_date,
             STRING_AGG(DISTINCT p.name, ', ' ORDER BY p.name) AS product_name,
             STRING_AGG(DISTINCT s.payment_method, ', ' ORDER BY s.payment_method) AS payment_method,
             COUNT(*)::INT AS line_items
           FROM sales s
           JOIN products p ON s.product_id = p.id
           GROUP BY COALESCE(s.transaction_id, 'SALE-' || s.id::text)
           ORDER BY MAX(s.sale_date) DESC, MAX(s.id) DESC
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        ),
        pool.query(
          `SELECT COUNT(*)
           FROM (
             SELECT 1
             FROM sales s
             GROUP BY COALESCE(s.transaction_id, 'SALE-' || s.id::text)
           ) grouped_sales`
        )
      ]);
    } else {
      [dataResult, countResult] = await Promise.all([
        pool.query(
          `SELECT
             s.id,
             COALESCE(s.transaction_id, 'SALE-' || s.id::text) AS transaction_id,
             s.quantity,
             s.total_amount,
             s.payment_method,
             s.sale_date,
             p.name  AS product_name,
             p.brand
           FROM sales s
           JOIN products p ON s.product_id = p.id
           ORDER BY s.id DESC
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        ),
        pool.query("SELECT COUNT(*) FROM sales")
      ]);
    }

    res.status(200).json({
      success: true,
      message: "Sales retrieved successfully",
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      grouped,
      sales: dataResult.rows
    });

  } catch (error) {
    logger.error('getSales error', {
      message: error.message,
      stack: error.stack,
      page: req.query.page,
      limit: req.query.limit
    });
    res.status(500).json({ success: false, message: "Server error", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

module.exports = { createSale, getSales };
