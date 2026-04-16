const logger = require("../utils/logger");
const pool = require("../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sanitizeUserData } = require("../utils/sanitize");

/* ================= REGISTER (Public → Staff or Customer) ================= */
const registerUser = async (req, res) => {
  try {
    logger.debug('[AUTH] Registration attempt for email:', req.body.email);

    let { name, email, password, role } = req.body;

    // Sanitize name
    const sanitized = sanitizeUserData({ name });
    name = sanitized.name;

    if (!name || !email || !password) {
      logger.debug('[AUTH] Registration failed: missing fields', { name: !!name, email: !!email, password: !!password });
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Validate role - only staff or customer allowed
    let userRole = role || "customer";
    const allowedRoles = ["staff", "customer"];
    if (!allowedRoles.includes(userRole)) {
      logger.debug('[AUTH] Invalid role provided, defaulting to customer:', role);
      userRole = "customer";
    }

    const existingUser = await pool.query(
      "SELECT id, email FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      logger.debug('[AUTH] Registration failed: email already exists', { email });
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    logger.debug('[AUTH] Password hashed successfully');

    await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)",
      [name, email, hashedPassword, userRole]
    );

    logger.info('[AUTH] User registered successfully', { email, role: userRole });
    res.status(201).json({ success: true, message: `${userRole} registered successfully ✅` });

  } catch (error) {
    logger.error('[AUTH] Registration error:', error);
    res.status(500).json({ success: false, message: "Server error", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};


/* ================= LOGIN ================= */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    logger.debug('[AUTH] Login attempt for email:', email);

    if (!email || !password) {
      logger.debug('[AUTH] Login failed: missing email or password');
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    // Case-insensitive email lookup (optional - comment out if case-sensitive is desired)
    // Using ILIKE for case-insensitive or lower() both sides
    const userResult = await pool.query(
      "SELECT id, name, email, password_hash, role FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );

    if (userResult.rows.length === 0) {
      logger.warn('[AUTH] Login failed: user not found', { email });
      // Security: use generic message to avoid user enumeration
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const user = userResult.rows[0];
    logger.debug('[AUTH] User found, comparing password hash');

    const isMatch = await bcrypt.compare(password, user.password_hash);
    logger.debug('[AUTH] Password match result:', { userId: user.id, email: user.email, isMatch });

    if (!isMatch) {
      logger.warn('[AUTH] Login failed: password mismatch', { userId: user.id, email: user.email });
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    logger.info('[AUTH] Login successful', { userId: user.id, email: user.email, role: user.role });

    res.status(200).json({
      success: true,
      message: "Login successful ✅",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    logger.error('[AUTH] Login error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/* ================= ADMIN CREATE USER ================= */
const createUserByAdmin = async (req, res) => {
  try {
    let { name, email, password, role } = req.body;
    // Sanitize name
    const sanitized = sanitizeUserData({ name });
    name = sanitized.name;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const allowedRoles = ["admin", "staff", "customer"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role type" });
    }

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)",
      [name, email, hashedPassword, role]
    );

    res.status(201).json({
      message: `${role} user created successfully ✅`
    });

  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Server error", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const userResult = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user: userResult.rows[0] });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Server error", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

const logoutUser = async (req, res) => {
  res.status(200).json({ success: true, message: "Logout successful" });
};

module.exports = {
  registerUser,
  loginUser,
  createUserByAdmin,
  getCurrentUser,
  logoutUser
};