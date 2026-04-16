-- ============================================================================
-- IntelliStock Audit Trail Schema
-- ============================================================================
-- This script creates the audit_logs table for tracking all data changes.
--
-- Usage:
--   psql -U postgres -d intellistock_db -f schema_audit.sql
-- ============================================================================

-- ── Audit Logs Table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, etc.
  table_name VARCHAR(100) NOT NULL,
  record_id INT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Indexes for Performance ──────────────────────────────────────────────────
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);

-- ── Row Level Security (Optional) ─────────────────────────────────────────────
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY admin_only ON audit_logs
--   USING (auth.jwt->>'role' = 'admin');

-- ============================================================================
-- End of Schema
-- ============================================================================
