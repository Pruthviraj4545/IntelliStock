const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/dashboard.controller");

const verifyToken = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

/* ============================================================
   🔹 MAIN DASHBOARD STATS
============================================================ */
router.get(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  getDashboardStats
);

router.get(
  "/analytics",
  verifyToken,
  authorizeRoles("admin"),
  getDashboardStats
);

/* ============================================================
   🔹 SALES SUMMARY (With Date Range Filter)
============================================================ */
router.get(
  "/sales-summary",
  verifyToken,
  authorizeRoles("admin", "staff"),
  getSalesSummary
);

/* ============================================================
   🔹 DAILY REVENUE TREND (Chart Ready)
============================================================ */
router.get(
  "/daily-trend",
  verifyToken,
  authorizeRoles("admin"),
  getDailyRevenueTrend
);

/* ============================================================
   🔹 MONTHLY REVENUE (Required analytics contract)
============================================================ */
router.get(
  "/monthly-revenue",
  verifyToken,
  authorizeRoles("admin"),
  getMonthlyRevenue
);

/* ============================================================
   🔹 TOP PRODUCTS
============================================================ */
router.get(
  "/top-products",
  verifyToken,
  authorizeRoles("admin", "staff"),
  getTopProducts
);

/* ============================================================
   🔹 LOW PERFORMING PRODUCTS
============================================================ */
router.get(
  "/low-performing",
  verifyToken,
  authorizeRoles("admin"),
  getLowPerformingProducts
);

/* ============================================================
   🔹 PRODUCT-WISE PROFIT BREAKDOWN
============================================================ */
router.get(
  "/product-profit",
  verifyToken,
  authorizeRoles("admin"),
  getProductProfitReport
);

/* ============================================================
   🔹 PROFIT REPORT (Required analytics contract)
============================================================ */
router.get(
  "/profit-report",
  verifyToken,
  authorizeRoles("admin"),
  getProfitReport
);

/* ============================================================
   🔹 INVENTORY VALUATION
============================================================ */
router.get(
  "/inventory-value",
  verifyToken,
  authorizeRoles("admin"),
  getInventoryValuation
);

router.get(
  "/inventory-overview",
  verifyToken,
  authorizeRoles("admin", "staff"),
  getInventorySalesOverview
);

/* ============================================================
   🔹 ALERT SUMMARY
============================================================ */
router.get(
  "/alert-summary",
  verifyToken,
  authorizeRoles("admin"),
  getAlertSummary
);

module.exports = router;