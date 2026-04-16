const Joi = require('joi');

// User Registration/Login
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(255).required()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 255 characters',
      'any.required': 'Name is required'
    }),
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and number',
      'any.required': 'Password is required'
    }),
  role: Joi.string().valid('admin', 'staff', 'customer').required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Product
const productSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  category: Joi.string().max(100).optional().allow(''),
  brand: Joi.string().max(100).optional().allow(''),
  cost_price: Joi.number().min(0).precision(2).required()
    .messages({
      'number.min': 'Cost price cannot be negative',
      'any.required': 'Cost price is required',
      'number.precision': 'Cost price can have at most 2 decimal places'
    }),
  selling_price: Joi.number().min(0).precision(2).required()
    .messages({
      'number.min': 'Selling price cannot be negative',
      'any.required': 'Selling price is required',
      'number.precision': 'Selling price can have at most 2 decimal places'
    }),
  stock_quantity: Joi.number().integer().min(0).required(),
  expiry_date: Joi.date().iso().optional().allow(null, ''),
  discount_percentage: Joi.number().min(0).max(100).optional()
});

const applyDiscountSchema = Joi.object({
  discount_percentage: Joi.number().min(0).max(100).required()
});

// Sale
const saleSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).required(),
  payment_method: Joi.string().valid('cash', 'card', 'upi', 'wallet').optional(),
  transaction_id: Joi.string().max(80).optional()
});

// Filters - Simplified schema, let controller handle value parsing
const filterProductsSchema = Joi.object({
  query: Joi.any().optional(),
  category: Joi.any().optional(),
  brand: Joi.any().optional(),
  minPrice: Joi.any().optional(),
  maxPrice: Joi.any().optional(),
  stockStatus: Joi.any().optional(),
  dateFrom: Joi.any().optional(),
  dateTo: Joi.any().optional(),
  expiryBefore: Joi.any().optional(),
  sortBy: Joi.any().optional(),
  sortOrder: Joi.any().optional(),
  page: Joi.any().optional(),
  limit: Joi.any().optional()
}).unknown(true);

module.exports = {
  registerSchema,
  loginSchema,
  productSchema,
  applyDiscountSchema,
  saleSchema,
  filterProductsSchema
};
