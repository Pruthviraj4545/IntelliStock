const express = require("express");
const router = express.Router();

const { getMonthlySalesReport, getAdvancedSalesReport } = require("../controllers/report.controller");

const verifyToken = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

/* ================= MONTHLY SALES REPORT ================= */
/* Admin Only */
router.get(
  "/monthly-sales",
  verifyToken,
  authorizeRoles("admin", "staff"),
  getMonthlySalesReport
);

router.get(
  "/advanced-sales",
  verifyToken,
  authorizeRoles("admin", "staff"),
  getAdvancedSalesReport
);

module.exports = router;