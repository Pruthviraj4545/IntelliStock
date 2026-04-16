const express = require("express");
const router = express.Router();
const {
  createInvoice,
  getInvoice,
  getInvoices,
  getLowStockAlerts,
  acknowledgeAlert
} = require("../controllers/invoice.controller");

const verifyToken = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

// ============================================================================
// INVOICE ROUTES
// ============================================================================

// Create new invoice (billing)
router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "staff"),
  createInvoice
);

// Get invoice by ID
router.get(
  "/:invoiceId",
  verifyToken,
  authorizeRoles("admin", "staff"),
  getInvoice
);

// Get invoices (with pagination and customer filtering)
router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "staff"),
  getInvoices
);

// ============================================================================
// LOW STOCK ALERTS ROUTES
// ============================================================================

// Get low stock alerts
router.get(
  "/alerts/low-stock",
  verifyToken,
  authorizeRoles("admin", "staff"),
  getLowStockAlerts
);

// Acknowledge low stock alert
router.patch(
  "/alerts/:alertId/acknowledge",
  verifyToken,
  authorizeRoles("admin", "staff"),
  acknowledgeAlert
);

module.exports = router;
