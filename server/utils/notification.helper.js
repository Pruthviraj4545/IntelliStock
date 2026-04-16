const pool = require("../db/db");

const createNotification = async (message, role) => {
  try {
    await pool.query(
      "INSERT INTO notifications (message, role) VALUES ($1, $2)",
      [message, role]
    );
  } catch (error) {
    console.error("Notification creation failed:", error.message);
  }
};

module.exports = { createNotification };