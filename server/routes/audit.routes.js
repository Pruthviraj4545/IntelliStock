const express = require("express");
const router = express.Router();
const pool = require("../db/db");
const verifyToken = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const logger = require("../utils/logger");

// GET /api/audit-logs - Admin only, with optional filters
router.get('/', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      user_id,
      action,
      table_name,
      start_date,
      end_date
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const values = [];
    let idx = 1;

    if (user_id) {
      conditions.push(`user_id = $${idx++}`);
      values.push(user_id);
    }
    if (action) {
      conditions.push(`action = $${idx++}`);
      values.push(action);
    }
    if (table_name) {
      conditions.push(`table_name = $${idx++}`);
      values.push(table_name);
    }
    if (start_date) {
      conditions.push(`created_at >= $${idx++}`);
      values.push(start_date);
    }
    if (end_date) {
      conditions.push(`created_at <= $${idx++}`);
      values.push(end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT al.*, u.name as user_name, u.email as user_email
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ${whereClause}
         ORDER BY al.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, parseInt(limit), offset]
      ),
      pool.query(
        `SELECT COUNT(*) FROM audit_logs ${whereClause}`,
        values
      )
    ]);

    res.json({
      success: true,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
      logs: dataResult.rows
    });
  } catch (error) {
    logger.error('getAuditLogs error', {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

// GET /api/audit-logs/:id - Get single audit log entry
router.get('/:id', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT al.*, u.name as user_name, u.email as user_email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Audit log not found' });
    }

    res.json({ success: true, log: result.rows[0] });
  } catch (error) {
    logger.error('getAuditLogById error', {
      message: error.message,
      stack: error.stack,
      logId: req.params.id
    });
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

// GET /api/audit-logs/summary - Summary statistics
router.get('/summary/stats', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [
      totalLogs,
      recentActivity,
      actionCounts
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM audit_logs'),
      pool.query(
        `SELECT action, COUNT(*) as count
         FROM audit_logs
         WHERE created_at >= NOW() - INTERVAL '24 hours'
         GROUP BY action
         ORDER BY count DESC`
      ),
      pool.query(
        `SELECT table_name, COUNT(*) as count
         FROM audit_logs
         GROUP BY table_name
         ORDER BY count DESC`
      )
    ]);

    res.json({
      success: true,
      stats: {
        total_logs: parseInt(totalLogs.rows[0].count),
        recent_24h: recentActivity.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
        by_action: recentActivity.rows,
        by_table: actionCounts.rows
      }
    });
  } catch (error) {
    logger.error('getAuditSummary error', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

// DELETE /api/audit-logs/:id - Delete specific audit log (admin only, for cleanup)
router.delete('/:id', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM audit_logs WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Audit log not found' });
    }

    res.json({ success: true, message: 'Audit log deleted' });
  } catch (error) {
    logger.error('deleteAuditLog error', {
      message: error.message,
      stack: error.stack,
      logId: req.params.id
    });
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

// POST /api/audit-logs/cleanup - Clean up old logs (admin only)
router.post('/cleanup', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { days_old = 90 } = req.body;

    const result = await pool.query(
      'DELETE FROM audit_logs WHERE created_at < NOW() - $1 * INTERVAL \'1 day\' RETURNING id',
      [parseInt(days_old)]
    );

    res.json({
      success: true,
      message: `Deleted ${result.rowCount} old audit log entries`,
      deleted_count: result.rowCount
    });
  } catch (error) {
    logger.error('cleanupAuditLogs error', {
      message: error.message,
      stack: error.stack,
      days_old: req.body.days_old
    });
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

module.exports = router;
