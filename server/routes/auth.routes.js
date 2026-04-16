const express = require("express");
const router = express.Router();
const pool = require("../db/db");

const {
  registerUser,
  loginUser,
  createUserByAdmin
} = require("../controllers/auth.controller");

const verifyToken = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const { registerSchema, loginSchema } = require("../validation/validation");
const { authLimiter } = require("../middleware/rateLimit.middleware");

// Public Routes with rate limiting
router.post("/register", authLimiter, validate(registerSchema), registerUser);
router.post("/login", authLimiter, validate(loginSchema), loginUser);

// Protected Routes
router.get("/me", verifyToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [req.user.id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user: userResult.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", verifyToken, (req, res) => {
  res.status(200).json({ message: "Logout successful" });
});

// Admin Only – Create staff/admin/customer
router.post(
  "/create-user",
  verifyToken,
  authorizeRoles("admin"),
  createUserByAdmin
);

module.exports = router;
