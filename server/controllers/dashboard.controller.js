const logger = require("../utils/logger");
/**
 * IntelliStock Advanced Analytics Controller
 * -------------------------------------------
 * Enterprise-level dashboard intelligence
 */

const pool = require("../db/db");
const { getCache, setCache } = require("../utils/cache");

const toNumber = (value) => Number(value || 0);

const buildSalesPeriodClause = (period, startDate, endDate, range) => {
  const values = [];
  let whereClause = '';

  if (startDate && endDate) {
    whereClause = 'WHERE s.sale_date >= $1::date AND s.sale_date < ($2::date + INTERVAL \'1 day\')';
    values.push(startDate, endDate);
  } else if (period === 'today') {
    whereClause = "WHERE s.sale_date >= CURRENT_DATE AND s.sale_date < (CURRENT_DATE + INTERVAL '1 day')";
  } else if (period === 'month') {
    whereClause = "WHERE DATE_TRUNC('month', s.sale_date) = DATE_TRUNC('month', CURRENT_DATE)";
  } else if (range === '7d') {
    whereClause = "WHERE s.sale_date >= (CURRENT_DATE - INTERVAL '6 days') AND s.sale_date < (CURRENT_DATE + INTERVAL '1 day')";
  } else if (range === '30d') {
    whereClause = "WHERE s.sale_date >= (CURRENT_DATE - INTERVAL '29 days') AND s.sale_date < (CURRENT_DATE + INTERVAL '1 day')";
  } else if (range === '12m') {
    whereClause = "WHERE s.sale_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months' AND s.sale_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'";
  }

  return { whereClause, values };
};

/* ============================================================
   🔹 DASHBOARD STATS (Legacy - kept for compatibility)
============================================================ */
const getDashboardStats = async (req, res) => {
  try {
    const cacheKey = 'dashboard:stats';
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const [
      totalProducts,
      activeProducts,
      totalStock,
      lowStock,
      totalRevenue,
      totalSales
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM products"),
      pool.query("SELECT COUNT(*) FROM products WHERE is_active = TRUE"),
      pool.query("SELECT COALESCE(SUM(stock_quantity), 0) AS total FROM products WHERE is_active = TRUE"),
      pool.query(`
        SELECT COUNT(*) FROM products
        WHERE stock_quantity <= reorder_level AND is_active = TRUE
      `),
      pool.query("SELECT COALESCE(SUM(total_amount), 0) AS total FROM sales"),
      pool.query("SELECT COUNT(*) FROM sales")
    ]);

    const responseData = {
      success: true,
      message: "Dashboard statistics retrieved successfully",
      total_products: parseInt(totalProducts.rows[0].count),
      active_products: parseInt(activeProducts.rows[0].count),
      total_stock_quantity: parseInt(totalStock.rows[0].total),
      low_stock_products: parseInt(lowStock.rows[0].count),
      total_revenue: parseFloat(totalRevenue.rows[0].total),
      total_sales: parseInt(totalSales.rows[0].count)
    };

    await setCache(cacheKey, responseData, 300); // 5 minutes

    res.status(200).json(responseData);

  } catch (error) {
    logger.error("getDashboardStats error", { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: "Server error", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

/* ============================================================
   🔹 SALES SUMMARY (With Date Filter)
============================================================ */
const getSalesSummary = async (req, res) => {
  try {
    const { period = 'all', start_date, end_date, range = '12m' } = req.query;

    const { whereClause, values } = buildSalesPeriodClause(period, start_date, end_date, range);

    let query = `
      SELECT
        COUNT(DISTINCT COALESCE(NULLIF(TRIM(s.transaction_id), ''), 'SALE-' || s.id::text)) AS total_orders,
        COALESCE(SUM(total_amount),0) AS total_revenue,
        COALESCE(SUM(quantity),0) AS total_items_sold,
        CASE
          WHEN COUNT(DISTINCT COALESCE(NULLIF(TRIM(s.transaction_id), ''), 'SALE-' || s.id::text)) > 0
          THEN COALESCE(SUM(total_amount),0) / COUNT(DISTINCT COALESCE(NULLIF(TRIM(s.transaction_id), ''), 'SALE-' || s.id::text))
          ELSE 0
        END AS average_order_value
      FROM sales s
    `;

    query += ` ${whereClause}`;

    const result = await pool.query(query, values);

    const summaryRow = result.rows[0] || {};
    const summary = {
      total_orders: toNumber(summaryRow.total_orders),
      total_sales: toNumber(summaryRow.total_orders),
      total_revenue: toNumber(summaryRow.total_revenue),
      total_items_sold: toNumber(summaryRow.total_items_sold),
      average_order_value: Number(toNumber(summaryRow.average_order_value).toFixed(2))
    };

    res.status(200).json({
      success: true,
      message: "Sales summary retrieved successfully",
      period,
      range,
      empty: summary.total_orders === 0,
      summary
    });

  } catch (error) {
    logger.error("Sales Summary Error error", { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: "Failed to fetch sales summary", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

/* ============================================================
   🔹 DAILY REVENUE TREND (Chart Ready)
============================================================ */
const getDailyRevenueTrend = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        sale_date::date AS date,
        SUM(total_amount) AS revenue
      FROM sales
      GROUP BY date
      ORDER BY date ASC
    `);

    res.status(200).json({
      success: true,
      message: "Daily revenue trend retrieved successfully",
      daily_trend: result.rows
    });

  } catch (error) {
    logger.error("Daily Trend Error error", { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: "Failed to fetch daily revenue trend", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

/* ============================================================
   🔹 MONTHLY REVENUE REPORT (Required analytics contract)
============================================================ */
const getMonthlyRevenue = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', sale_date), 'YYYY-MM') AS month,
        COALESCE(SUM(total_amount), 0) AS revenue,
        COUNT(*) AS total_orders
      FROM sales
      GROUP BY DATE_TRUNC('month', sale_date)
      ORDER BY DATE_TRUNC('month', sale_date) ASC
    `);

    res.status(200).json({
      success: true,
      message: "Monthly revenue retrieved successfully",
      monthly_revenue: result.rows
    });

  } catch (error) {
    logger.error("Monthly Revenue Error error", { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: "Failed to fetch monthly revenue", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

/* ============================================================
   🔹 TOP PRODUCTS
============================================================ */
const getTopProducts = async (req, res) => {
  try {
    const { period = 'all', start_date, end_date, range = '12m' } = req.query;
    const { whereClause, values } = buildSalesPeriodClause(period, start_date, end_date, range);

    const result = await pool.query(`
      SELECT
        p.id,
        p.name,
        COALESCE(SUM(s.quantity), 0) AS total_sold,
        COALESCE(SUM(s.total_amount), 0) AS revenue_generated
      FROM sales s
      JOIN products p ON s.product_id = p.id
      ${whereClause}
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC, revenue_generated DESC
      LIMIT 10
    `, values);

    const topProducts = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      total_sold: toNumber(row.total_sold),
      revenue_generated: toNumber(row.revenue_generated)
    }));

    res.status(200).json({
      success: true,
      message: "Top products retrieved successfully",
      period,
      range,
      empty: topProducts.length === 0,
      top_products: topProducts
    });

  } catch (error) {
    logger.error("Top Products Error error", { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: "Failed to fetch top products", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

/* ============================================================
   🔹 LOW PERFORMING PRODUCTS
============================================================ */
const getLowPerformingProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.name,
        COALESCE(SUM(s.quantity),0) AS total_sold
      FROM products p
      LEFT JOIN sales s ON s.product_id = p.id
      WHERE p.is_active = TRUE
      GROUP BY p.id, p.name
      ORDER BY total_sold ASC
      LIMIT 5
    `);

    res.status(200).json({
      success: true,
      message: "Low performing products retrieved successfully",
      low_performing_products: result.rows
    });

  } catch (error) {
    logger.error("Low Performing Error error", { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: "Failed to fetch low performing products", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

/* ============================================================
   🔹 PRODUCT-WISE PROFIT BREAKDOWN
============================================================ */
const getProductProfitReport = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.name,
        COALESCE(SUM(s.total_amount), 0) AS revenue,
        COALESCE(SUM(p.cost_price * s.quantity), 0) AS cost,
        COALESCE(SUM(s.total_amount - (p.cost_price * s.quantity)), 0) AS profit
      FROM products p
      LEFT JOIN sales s ON s.product_id = p.id
      WHERE p.is_active = TRUE
      GROUP BY p.id, p.name
      ORDER BY profit DESC
    `);

    res.status(200).json({
      success: true,
      message: "Product profit report retrieved successfully",
      product_profit_report: result.rows
    });

  } catch (error) {
    logger.error("Product Profit Error error", { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: "Failed to fetch product profit report", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

/* ============================================================
   🔹 PROFIT REPORT (Required analytics contract)
============================================================ */
const getProfitReport = async (req, res) => {
  try {
    const [overallResult, productResult] = await Promise.all([
      pool.query(`
        SELECT
          COALESCE(SUM(s.total_amount), 0) AS total_revenue,
          COALESCE(SUM(p.cost_price * s.quantity), 0) AS total_cost,
          COALESCE(SUM(s.total_amount - (p.cost_price * s.quantity)), 0) AS total_profit
        FROM sales s
        JOIN products p ON s.product_id = p.id
      `),
      pool.query(`
        SELECT
          p.id,
          p.name,
          COALESCE(SUM(s.total_amount), 0) AS revenue,
          COALESCE(SUM(p.cost_price * s.quantity), 0) AS cost,
          COALESCE(SUM(s.total_amount - (p.cost_price * s.quantity)), 0) AS profit
        FROM products p
        LEFT JOIN sales s ON s.product_id = p.id
        WHERE p.is_active = TRUE
        GROUP BY p.id, p.name
        ORDER BY profit DESC
      `)
    ]);

    const totals = overallResult.rows[0];

    res.status(200).json({
      success: true,
      message: "Profit report retrieved successfully",
      summary: {
        total_revenue: parseFloat(totals.total_revenue),
        total_cost: parseFloat(totals.total_cost),
        total_profit: parseFloat(totals.total_profit)
      },
      by_product: productResult.rows
    });

  } catch (error) {
    logger.error("Profit Report Error error", { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: "Failed to fetch profit report", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

/* ============================================================
   🔹 INVENTORY VALUATION
============================================================ */
const getInventoryValuation = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        SUM(stock_quantity * cost_price) AS total_inventory_value,
        COUNT(*) AS total_products,
        COALESCE(AVG(stock_quantity), 0) AS avg_stock_per_product
      FROM products
      WHERE is_active = TRUE
    `);

    res.status(200).json({
      success: true,
      message: "Inventory valuation retrieved successfully",
      inventory_valuation: result.rows[0]
    });

  } catch (error) {
    logger.error("Inventory Valuation Error error", { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: "Failed to calculate inventory value", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

/* ============================================================
   🔹 ALERT SUMMARY
============================================================ */
const getAlertSummary = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS unread_notifications
      FROM notifications
      WHERE is_read = FALSE
    `);

    res.status(200).json({
      success: true,
      message: "Alert summary retrieved successfully",
      alert_summary: result.rows[0]
    });

  } catch (error) {
    logger.error("Alert Summary Error error", { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: "Failed to fetch alert summary", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

/* ============================================================
   🔹 INVENTORY SALES OVERVIEW
============================================================ */
const getInventorySalesOverview = async (req, res) => {
  try {
    const { period = 'all', start_date, end_date } = req.query;

    const { whereClause, values } = buildSalesPeriodClause(period, start_date, end_date);

    const [summaryResult, productResult] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(DISTINCT COALESCE(s.transaction_id, 'SALE-' || s.id::text)) AS total_bills,
           COALESCE(SUM(s.quantity), 0) AS total_units_sold,
           COALESCE(SUM(s.total_amount), 0) AS total_revenue,
           COUNT(DISTINCT s.product_id) AS products_sold
         FROM sales s
         ${whereClause}`,
        values
      ),
      pool.query(
        `SELECT
           p.id,
           p.name,
           p.category,
           p.brand,
           COALESCE(SUM(s.quantity), 0) AS units_sold,
           COALESCE(SUM(s.total_amount), 0) AS revenue,
           COUNT(*) AS sale_lines
         FROM sales s
         JOIN products p ON p.id = s.product_id
         ${whereClause}
         GROUP BY p.id, p.name, p.category, p.brand
         ORDER BY COALESCE(SUM(s.quantity), 0) DESC, COALESCE(SUM(s.total_amount), 0) DESC`,
        values
      )
    ]);

    res.status(200).json({
      success: true,
      message: 'Inventory sales overview retrieved successfully',
      period,
      summary: summaryResult.rows[0],
      products: productResult.rows
    });
  } catch (error) {
    logger.error('Inventory Sales Overview Error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to fetch inventory sales overview', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

module.exports = {
  getDashboardStats,
  getSalesSummary,
  getDailyRevenueTrend,
  getMonthlyRevenue,
  getTopProducts,
  getLowPerformingProducts,
  getProductProfitReport,
  getProfitReport,
  getInventoryValuation,
  getAlertSummary,
  getInventorySalesOverview
};
