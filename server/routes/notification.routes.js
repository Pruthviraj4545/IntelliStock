const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const pool = require("../db/db");

/* ================= GET NOTIFICATIONS ================= */
router.get("/", verifyToken, async (req, res) => {
  try {
    const role = req.user.role;

    let result;

    if (role === "admin") {
      result = await pool.query(
        "SELECT * FROM notifications ORDER BY created_at DESC"
      );
    } else {
      result = await pool.query(
        "SELECT * FROM notifications WHERE role = $1 ORDER BY created_at DESC",
        [role]
      );
    }

    res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      count: result.rows.length,
      notifications: result.rows
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch notifications", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

/* ================= MARK AS READ ================= */
router.put("/:id/read", verifyToken, async (req, res) => {
  try {
    await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE id = $1",
      [req.params.id]
    );

    res.status(200).json({ success: true, message: "Notification marked as read ✅" });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update notification", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

module.exports = router;