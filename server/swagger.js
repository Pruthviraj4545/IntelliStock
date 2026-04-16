const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'IntelliStock API',
    version: '1.0.0',
    description: 'Inventory Management System API with ML Forecasting',
    contact: {
      name: 'IntelliStock Team',
      email: 'support@intellistock.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server'
    },
    {
      url: 'https://api.intellistock.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token in the format: Bearer <token>'
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for ML service access'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User registration, login, and session management'
    },
    {
      name: 'Products',
      description: 'Product management, CRUD operations, inventory tracking'
    },
    {
      name: 'Sales',
      description: 'Sales transactions, receipts, and order history'
    },
    {
      name: 'Dashboard',
      description: 'Analytics, metrics, and business intelligence'
    },
    {
      name: 'Reports',
      description: 'Generate and download reports'
    },
    {
      name: 'Admin',
      description: 'Administrative functions, ML model training, reorder suggestions'
    },
    {
      name: 'Notifications',
      description: 'System notifications and alerts'
    },
    {
      name: 'Health',
      description: 'System health checks'
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js', './controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
