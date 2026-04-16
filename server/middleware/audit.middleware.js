const pool = require('../db/db');
const logger = require('../utils/logger');

/**
 * Audit Middleware
 *
 * Automatically logs CRUD operations to audit_logs table.
 * Only logs non-GET requests (state-changing operations).
 *
 * Usage: Apply to routes you want to audit
 *   app.use('/api/products', auditMiddleware);
 *   app.use('/api/sales', auditMiddleware);
 */
const auditMiddleware = async (req, res, next) => {
  // Only log state-changing operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Extract table name from path (/api/products/123 → products)
  const pathSegments = req.path.split('/').filter(s => s);
  const tableName = pathSegments[1] || 'unknown'; // /api/:table/:id

  // Get record ID from params if updating/deleting specific record
  const recordId = req.params.id || null;

  // Store original json method to intercept response
  const originalJson = res.json.bind(res);

  // Capture response data after it's sent
  res.json = function(body) {
    // Only log successful operations (2xx, 3xx)
    if (res.statusCode >= 200 && res.statusCode < 400 && req.user) {
      const logAudit = async () => {
        try {
          // For updates/deletes, try to fetch old values
          let oldValues = null;
          if ((req.method === 'PUT' || req.method === 'DELETE') && recordId) {
            try {
              const result = await pool.query(
                `SELECT * FROM ${tableName} WHERE id = $1`,
                [recordId]
              );
              if (result.rows.length > 0) {
                // Remove sensitive fields if needed
                const old = { ...result.rows[0] };
                // Don't log password hashes or sensitive data
                delete old.password_hash;
                delete old.refresh_token;
                oldValues = old;
              }
            } catch (err) {
              logger.warn('Audit: Could not fetch old values', {
                table: tableName,
                recordId,
                error: err.message
              });
            }
          }

          // Prepare new values - sanitize sensitive fields
          let newValues = body && typeof body === 'object' ? { ...body } : null;
          if (newValues) {
            delete newValues.password_hash;
            delete newValues.refresh_token;
            delete newValues.token;
          }

          // Determine action type
          const actionMap = {
            POST: 'CREATE',
            PUT: 'UPDATE',
            PATCH: 'UPDATE',
            DELETE: 'DELETE'
          };
          const action = actionMap[req.method] || req.method;

          // Insert audit log
          await pool.query(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              req.user.id,
              action,
              tableName,
              recordId,
              oldValues ? JSON.stringify(oldValues) : null,
              newValues ? JSON.stringify(newValues) : null,
              req.ip || req.connection.remoteAddress,
              req.get('User-Agent')
            ]
          );

          logger.info('Audit log created', {
            userId: req.user.id,
            action,
            table: tableName,
            recordId,
            ip: req.ip
          });
        } catch (err) {
          // Audit logging should never break the main flow
          logger.error('Audit logging failed', {
            error: err.message,
            stack: err.stack,
            table: tableName,
            recordId,
            userId: req.user?.id
          });
        }
      };

      // Execute audit logging asynchronously (don't wait)
      logAudit().catch(err => {
        logger.error('Audit async error', err);
      });
    }

    return originalJson.call(this, body);
  };

  next();
};

module.exports = auditMiddleware;
