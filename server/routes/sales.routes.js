const express = require("express");
const router = express.Router();

const { createSale, getSales } = require("../controllers/sales.controller");

const verifyToken = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const { saleSchema } = require("../validation/validation");

/* ================= CREATE SALE ================= */
/* Staff + Admin */
router.post(
  "/",
  verifyToken,
  authorizeRoles("staff", "admin"),
  validate(saleSchema),
  createSale
);

/* ================= VIEW SALES ================= */
/* Admin Only */
router.get(
  "/",
  verifyToken,
  authorizeRoles("staff", "admin"),
  getSales
);

module.exports = router;