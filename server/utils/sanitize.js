/**
 * Sanitization utilities to prevent XSS and data pollution
 */

/**
 * Strip HTML tags from a string
 * @param {string} input - The input string
 * @returns {string} - String without HTML tags
 */
const stripHtml = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/<[^>]*>/g, '');
};

/**
 * Sanitize product data fields
 * @param {Object} data - Product data object
 * @returns {Object} - Sanitized product data
 */
const sanitizeProductData = (data) => {
  const { name, category, brand, sku } = data;
  return {
    ...data,
    name: name ? stripHtml(name).trim() : name,
    category: category ? stripHtml(category).trim() : category,
    brand: brand ? stripHtml(brand).trim() : brand,
    sku: sku ? stripHtml(sku).trim() : sku
  };
};

/**
 * Sanitize user data fields
 * @param {Object} data - User data object
 * @returns {Object} - Sanitized user data
 */
const sanitizeUserData = (data) => {
  const { name } = data;
  return {
    ...data,
    name: name ? stripHtml(name).trim() : name
  };
};

module.exports = {
  stripHtml,
  sanitizeProductData,
  sanitizeUserData
};
