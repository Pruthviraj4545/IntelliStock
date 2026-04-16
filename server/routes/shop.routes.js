const express = require("express");
const router = express.Router();
const {
  getShopDetails,
  createOrUpdateShopDetails,
  getCustomers,
  getOrCreateCustomer,
  updateCustomer,
  getFrequentCustomers,
  getCustomerDetails
} = require("../controllers/shop.controller");

const verifyToken = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

// ============================================================================
// SHOP DETAILS ROUTES
// ============================================================================

// Get shop details
router.get("/shop-details", getShopDetails);

// Create/Update shop details (Admin only)
router.post(
  "/shop-details",
  verifyToken,
  authorizeRoles("admin", "staff"),
  createOrUpdateShopDetails
);

// ============================================================================
// CUSTOMER ROUTES
// ============================================================================

// Get all customers (pagination, search)
router.get(
  "/customers",
  verifyToken,
  authorizeRoles("admin", "staff"),
  getCustomers
);

// Get or create customer (for quick customer entry during billing)
router.post(
  "/customers/get-or-create",
  verifyToken,
  authorizeRoles("admin", "staff"),
  getOrCreateCustomer
);

// Update customer details
router.put(
  "/customers/:id",
  verifyToken,
  authorizeRoles("admin", "staff"),
  updateCustomer
);

// Get frequent customers
router.get(
  "/customers/frequent",
  verifyToken,
  authorizeRoles("admin", "staff"),
  getFrequentCustomers
);

// Get specific customer details with history
router.get(
  "/customers/:customerId/details",
  verifyToken,
  authorizeRoles("admin", "staff"),
  getCustomerDetails
);

module.exports = router;
