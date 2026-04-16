const logger = require("../utils/logger");
const pool = require("../db/db");

const toNumber = (value) => Number(value || 0);

const buildSalesFilter = ({ range, start_date, end_date }, tableAlias = "s") => {
  const values = [];
  let whereClause = "";

  if (range === "7d") {
    whereClause = `WHERE ${tableAlias}.sale_date >= (CURRENT_DATE - INTERVAL '6 days') AND ${tableAlias}.sale_date < (CURRENT_DATE + INTERVAL '1 day')`;
  } else if (range === "30d") {
    whereClause = `WHERE ${tableAlias}.sale_date >= (CURRENT_DATE - INTERVAL '29 days') AND ${tableAlias}.sale_date < (CURRENT_DATE + INTERVAL '1 day')`;
  } else if (range === "12m") {
    whereClause = `WHERE ${tableAlias}.sale_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months' AND ${tableAlias}.sale_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`;
  } else if (start_date && end_date) {
    whereClause = `WHERE ${tableAlias}.sale_date >= $1::date AND ${tableAlias}.sale_date < ($2::date + INTERVAL '1 day')`;
    values.push(start_date, end_date);
  }

  return { whereClause, values };
};

const getMonthlySalesReport = async (req, res) => {
  try {
    const { range = "12m", start_date, end_date, granularity = "auto" } = req.query;
    const { whereClause, values } = buildSalesFilter({ range, start_date, end_date }, "s");
    const useDailyBuckets = granularity === "day" || (granularity === "auto" && (range === "7d" || range === "30d"));
    const bucketExpression = useDailyBuckets
      ? "DATE_TRUNC('day', s.sale_date)"
      : "DATE_TRUNC('month', s.sale_date)";
    const bucketLabel = useDailyBuckets
      ? "TO_CHAR(DATE_TRUNC('day', s.sale_date), 'YYYY-MM-DD')"
      : "TO_CHAR(DATE_TRUNC('month', s.sale_date), 'YYYY-MM')";

    const result = await pool.query(
      `
      SELECT 
        ${bucketLabel} AS month,
        COALESCE(SUM(s.total_amount), 0) AS revenue,
        COALESCE(SUM(s.quantity), 0) AS total_quantity,
        COUNT(*) AS total_sales
      FROM sales s
      ${whereClause}
      GROUP BY ${bucketExpression}
      ORDER BY ${bucketExpression} ASC
    `,
      values
    );

    const monthlySales = result.rows.map((row) => ({
      month: row.month,
      revenue: toNumber(row.revenue),
      total_quantity: toNumber(row.total_quantity),
      total_sales: toNumber(row.total_sales)
    }));

    res.status(200).json({
      success: true,
      message: "Monthly sales report retrieved successfully",
      range,
      granularity: useDailyBuckets ? "day" : "month",
      empty: monthlySales.length === 0,
      monthly_sales: monthlySales,
      // Keep legacy key for backward compatibility.
      report: monthlySales
    });

  } catch (error) {
    logger.error("getMonthlySalesReport error", { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: "Server error", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const getAdvancedSalesReport = async (req, res) => {
  try {
    const [
      monthlyRows,
      paymentRows,
      categoryRows,
      topProductRows,
      lowProductRows,
      stockRows
    ] = await Promise.all([
      pool.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', sale_date), 'YYYY-MM') AS month,
          COALESCE(SUM(total_amount), 0) AS total_revenue,
          COALESCE(SUM(quantity), 0) AS total_quantity,
          COUNT(*) AS total_sales
        FROM sales
        GROUP BY DATE_TRUNC('month', sale_date)
        ORDER BY DATE_TRUNC('month', sale_date) ASC
      `),
      pool.query(`
        SELECT
          payment_method,
          COUNT(*) AS sales_count,
          COALESCE(SUM(total_amount), 0) AS revenue
        FROM sales
        GROUP BY payment_method
        ORDER BY revenue DESC
      `),
      pool.query(`
        SELECT
          COALESCE(NULLIF(p.category, ''), 'Uncategorized') AS category,
          COUNT(s.id) AS sales_count,
          COALESCE(SUM(s.quantity), 0) AS quantity,
          COALESCE(SUM(s.total_amount), 0) AS revenue
        FROM products p
        LEFT JOIN sales s ON s.product_id = p.id
        WHERE p.is_active = TRUE
        GROUP BY COALESCE(NULLIF(p.category, ''), 'Uncategorized')
        ORDER BY revenue DESC
      `),
      pool.query(`
        SELECT
          p.id,
          p.name,
          COALESCE(SUM(s.quantity), 0) AS total_quantity,
          COALESCE(SUM(s.total_amount), 0) AS total_revenue
        FROM products p
        LEFT JOIN sales s ON s.product_id = p.id
        WHERE p.is_active = TRUE
        GROUP BY p.id, p.name
        ORDER BY total_revenue DESC
        LIMIT 5
      `),
      pool.query(`
        SELECT
          p.id,
          p.name,
          COALESCE(SUM(s.quantity), 0) AS total_quantity,
          COALESCE(SUM(s.total_amount), 0) AS total_revenue
        FROM products p
        LEFT JOIN sales s ON s.product_id = p.id
        WHERE p.is_active = TRUE
        GROUP BY p.id, p.name
        ORDER BY total_quantity ASC, total_revenue ASC
        LIMIT 5
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE is_active = TRUE) AS active_products,
          COUNT(*) FILTER (WHERE is_active = TRUE AND stock_quantity = 0) AS out_of_stock,
          COUNT(*) FILTER (WHERE is_active = TRUE AND stock_quantity <= reorder_level) AS low_stock,
          COALESCE(SUM(stock_quantity), 0) FILTER (WHERE is_active = TRUE) AS stock_units
        FROM products
      `)
    ]);

    const monthlyTrend = monthlyRows.rows.map((row, index, list) => {
      const revenue = toNumber(row.total_revenue);
      const previousRevenue = index > 0 ? toNumber(list[index - 1].total_revenue) : 0;
      const growthPercent = previousRevenue > 0
        ? ((revenue - previousRevenue) / previousRevenue) * 100
        : 0;

      return {
        month: row.month,
        total_revenue: revenue,
        total_quantity: toNumber(row.total_quantity),
        total_sales: toNumber(row.total_sales),
        average_sale_value: toNumber(row.total_sales) > 0 ? revenue / toNumber(row.total_sales) : 0,
        revenue_growth_percent: Number(growthPercent.toFixed(2))
      };
    });

    const totals = monthlyTrend.reduce((acc, row) => {
      acc.revenue += row.total_revenue;
      acc.sales += row.total_sales;
      acc.quantity += row.total_quantity;
      return acc;
    }, { revenue: 0, sales: 0, quantity: 0 });

    const paymentMix = paymentRows.rows.map((row) => ({
      payment_method: row.payment_method || 'unknown',
      sales_count: toNumber(row.sales_count),
      revenue: toNumber(row.revenue)
    }));

    const categoryPerformance = categoryRows.rows.map((row) => ({
      category: row.category,
      sales_count: toNumber(row.sales_count),
      quantity: toNumber(row.quantity),
      revenue: toNumber(row.revenue)
    }));

    const stockSummary = stockRows.rows[0] || {};

    const mostRecentMonth = monthlyTrend.length > 0 ? monthlyTrend[monthlyTrend.length - 1] : null;

    return res.status(200).json({
      success: true,
      message: "Advanced sales report retrieved successfully",
      generated_at: new Date().toISOString(),
      summary: {
        total_revenue: Number(totals.revenue.toFixed(2)),
        total_sales: totals.sales,
        total_quantity: totals.quantity,
        average_sale_value: totals.sales > 0 ? Number((totals.revenue / totals.sales).toFixed(2)) : 0,
        latest_month_revenue: mostRecentMonth?.total_revenue || 0,
        latest_month_growth_percent: mostRecentMonth?.revenue_growth_percent || 0
      },
      stock_risk: {
        active_products: toNumber(stockSummary.active_products),
        low_stock_products: toNumber(stockSummary.low_stock),
        out_of_stock_products: toNumber(stockSummary.out_of_stock),
        stock_units: toNumber(stockSummary.stock_units)
      },
      trend: monthlyTrend,
      payment_mix: paymentMix,
      category_performance: categoryPerformance,
      top_products: topProductRows.rows.map((row) => ({
        id: row.id,
        name: row.name,
        total_quantity: toNumber(row.total_quantity),
        total_revenue: toNumber(row.total_revenue)
      })),
      low_performing_products: lowProductRows.rows.map((row) => ({
        id: row.id,
        name: row.name,
        total_quantity: toNumber(row.total_quantity),
        total_revenue: toNumber(row.total_revenue)
      }))
    });
  } catch (error) {
    logger.error("getAdvancedSalesReport error", { message: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve advanced sales report",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getMonthlySalesReport,
  getAdvancedSalesReport
};