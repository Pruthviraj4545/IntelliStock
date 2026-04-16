const logger = require("../utils/logger");
const pool = require("../db/db");

// ============================================================================
// SHOP DETAILS CONTROLLER
// ============================================================================

const getShopDetails = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM shop_details ORDER BY created_at DESC LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Shop details not found. Please configure shop details first."
      });
    }

    res.status(200).json({
      success: true,
      shopDetails: result.rows[0]
    });
  } catch (error) {
    logger.error("getShopDetails error", { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch shop details",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const createOrUpdateShopDetails = async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      state,
      postal_code,
      contact_number,
      email,
      gst_number,
      pan_number,
      business_type,
      website,
      logo_url
    } = req.body;

    // Validation
    if (!name || !address || !contact_number || !gst_number) {
      return res.status(400).json({
        success: false,
        message: "Required fields: name, address, contact_number, gst_number"
      });
    }

    // Check if shop details already exist
    const existingResult = await pool.query(
      `SELECT id FROM shop_details LIMIT 1`
    );

    let result;
    if (existingResult.rows.length > 0) {
      // Update
      const shopId = existingResult.rows[0].id;
      result = await pool.query(
        `UPDATE shop_details 
         SET name = $1, address = $2, city = $3, state = $4, postal_code = $5,
             contact_number = $6, email = $7, gst_number = $8, pan_number = $9,
             business_type = $10, website = $11, logo_url = $12, updated_at = CURRENT_TIMESTAMP
         WHERE id = $13
         RETURNING *`,
        [name, address, city, state, postal_code, contact_number, email, gst_number,
         pan_number, business_type, website, logo_url, shopId]
      );
    } else {
      // Create
      result = await pool.query(
        `INSERT INTO shop_details (name, address, city, state, postal_code, contact_number,
                                   email, gst_number, pan_number, business_type, website, logo_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [name, address, city, state, postal_code, contact_number, email, gst_number,
         pan_number, business_type, website, logo_url]
      );
    }

    res.status(200).json({
      success: true,
      message: "Shop details saved successfully",
      shopDetails: result.rows[0]
    });
  } catch (error) {
    logger.error("createOrUpdateShopDetails error", { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to save shop details",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================================================
// CUSTOMERS CONTROLLER
// ============================================================================

const getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM customers`;
    let countQuery = `SELECT COUNT(*) FROM customers`;
    const params = [];

    if (search) {
      const searchPattern = `%${search}%`;
      query += ` WHERE name ILIKE $1 OR mobile_number ILIKE $1 OR email ILIKE $1`;
      countQuery += ` WHERE name ILIKE $1 OR mobile_number ILIKE $1 OR email ILIKE $1`;
      params.push(searchPattern);
    }

    query += ` ORDER BY last_purchase_date DESC NULLS LAST LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const [customersResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, search ? [params[0]] : [])
    ]);

    res.status(200).json({
      success: true,
      customers: customersResult.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    logger.error("getCustomers error", { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getOrCreateCustomer = async (req, res) => {
  try {
    const { mobile_number, name, email, address, city, state, postal_code } = req.body;

    if (!mobile_number) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required"
      });
    }

    // Check if customer exists
    let result = await pool.query(
      `SELECT * FROM customers WHERE mobile_number = $1`,
      [mobile_number]
    );

    if (result.rows.length > 0) {
      // Return existing customer
      return res.status(200).json({
        success: true,
        customer: result.rows[0],
        isNew: false
      });
    }

    // Create new customer
    result = await pool.query(
      `INSERT INTO customers (mobile_number, name, email, address, city, state, postal_code, first_purchase_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       RETURNING *`,
      [mobile_number, name || null, email || null, address || null, city || null, state || null, postal_code || null]
    );

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer: result.rows[0],
      isNew: true
    });
  } catch (error) {
    logger.error("getOrCreateCustomer error", { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to get or create customer",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, address, city, state, postal_code } = req.body;

    const result = await pool.query(
      `UPDATE customers
       SET name = COALESCE($1, name), email = COALESCE($2, email),
           address = COALESCE($3, address), city = COALESCE($4, city),
           state = COALESCE($5, state), postal_code = COALESCE($6, postal_code),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, email, address, city, state, postal_code, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer: result.rows[0]
    });
  } catch (error) {
    logger.error("updateCustomer error", { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to update customer",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getFrequentCustomers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await pool.query(
      `SELECT * FROM customers
       WHERE is_frequent_customer = TRUE
       ORDER BY total_amount_spent DESC
       LIMIT $1`,
      [limit]
    );

    res.status(200).json({
      success: true,
      frequentCustomers: result.rows
    });
  } catch (error) {
    logger.error("getFrequentCustomers error", { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch frequent customers",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getCustomerDetails = async (req, res) => {
  try {
    const { customerId } = req.params;

    const [customerResult, interactionsResult, invoicesResult] = await Promise.all([
      pool.query(`SELECT * FROM customers WHERE id = $1`, [customerId]),
      pool.query(
        `SELECT * FROM customer_interactions WHERE customer_id = $1 ORDER BY created_at DESC`,
        [customerId]
      ),
      pool.query(
        `SELECT * FROM invoices WHERE customer_id = $1 ORDER BY created_at DESC`,
        [customerId]
      )
    ]);

    if (customerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    res.status(200).json({
      success: true,
      customer: customerResult.rows[0],
      interactions: interactionsResult.rows,
      invoices: invoicesResult.rows
    });
  } catch (error) {
    logger.error("getCustomerDetails error", { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer details",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  // Shop Details
  getShopDetails,
  createOrUpdateShopDetails,
  // Customers
  getCustomers,
  getOrCreateCustomer,
  updateCustomer,
  getFrequentCustomers,
  getCustomerDetails
};
