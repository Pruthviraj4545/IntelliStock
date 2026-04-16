require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require('helmet');
const compression = require('compression');
const pool = require("./db/db");

const logger = require("./utils/logger");
const requestLogger = require("./middleware/requestLogger.middleware");

const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const salesRoutes = require("./routes/sales.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const reportRoutes = require("./routes/report.routes");
const verifyToken = require("./middleware/auth.middleware");
const mlRoutes = require("./routes/ml.routes");
const notificationRoutes = require("./routes/notification.routes");
const auditRoutes = require("./routes/audit.routes");
const shopRoutes = require("./routes/shop.routes");
const invoiceRoutes = require("./routes/invoice.routes");
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const app = express();
const PORT = process.env.PORT || 5000;


// ── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// ── CORS Configuration ──────────────────────────────────────────────────────
const defaultCorsOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002'
];
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : defaultCorsOrigins;

const isLocalhostOrigin = (origin) => {
  return /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || isLocalhostOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy blocked origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
// DISABLED FOR DEVELOPMENT - All endpoints are accessible without rate limiting

// ── Compression ─────────────────────────────────────────────────────────────
app.use(compression());

// ── Logging Middleware ──────────────────────────────────────────────────────
app.use(requestLogger);

// ── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static Files ────────────────────────────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/products", require('./middleware/audit.middleware'), productRoutes);
app.use("/api/sales", require('./middleware/audit.middleware'), salesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", mlRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/invoices", invoiceRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "IntelliStock Backend Running 🚀" });
});

// ── API Documentation ─────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'IntelliStock API Docs',
  customfavIcon: '/favicon.ico'
}));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ── Protected profile ────────────────────────────────────────────────────────
app.get("/api/profile", verifyToken, (req, res) => {
  res.json({ message: "Profile accessed successfully", user: req.user });
});

// ── DB health check ──────────────────────────────────────────────────────────
app.get("/health/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ message: "Database connected", time: result.rows[0] });
  } catch (error) {
    console.error("DB health check failed:", error.message);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    body: req.body
  });

  // Don't send stack traces in production
  const response = {
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  };

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  res.status(500).json(response);
});


// ── Demo Data Seeding ───────────────────────────────────────────────────────
const seedDemoUsers = async () => {
  try {
    const users = [
      { name: 'Admin', email: 'admin@example.com', password: 'password123', role: 'admin' },
      { name: 'Staff', email: 'staff@example.com', password: 'password123', role: 'staff' },
      { name: 'Client', email: 'client@example.com', password: 'password123', role: 'customer' },
    ];

    for (const u of users) {
      const exists = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [u.email]
      );
      const hashed = await require('bcrypt').hash(u.password, 10);
      
      if (exists.rows.length === 0) {
        // Create new user
        await pool.query(
          'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
          [u.name, u.email, hashed, u.role]
        );
        console.log(`✅ Demo user ${u.email} created`);
      } else {
        // Update existing user with fresh password hash (fixes corrupted hashes)
        await pool.query(
          'UPDATE users SET password_hash = $1, name = $2, role = $3 WHERE email = $4',
          [hashed, u.name, u.role, u.email]
        );
        console.log(`✅ Demo user ${u.email} updated with valid password`);
      }
    }
  } catch (err) {
    console.error('❌ Seeding demo users failed:', err.message);
    throw err;
  }
};

const startServer = async () => {
  try {
    await pool.ensureShopDetailsTable();
    logger.info('Shop details table verified successfully');
  } catch (err) {
    logger.error('Shop details table initialization failed', { error: err.message });
  }

  try {
    await pool.ensureSalesTransactionColumn();
    logger.info('Sales transaction column verified successfully');
  } catch (err) {
    logger.error('Sales transaction column initialization failed', { error: err.message });
  }

  try {
    await seedDemoUsers();
    logger.info('Demo users seeded successfully');
  } catch (err) {
    logger.error('Demo seeding failed, continuing to start server', { error: err.message });
  }

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
};

startServer();
