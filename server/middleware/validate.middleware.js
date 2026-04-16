const { validationResult } = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    // Determine which data to validate based on route type
    let dataToValidate;

    if (req.method === 'GET' || req.method === 'DELETE') {
      // For GET/DELETE, validate query params and path params
      dataToValidate = {
        ...(req.query && typeof req.query === 'object' ? req.query : {}),
        ...(req.params && typeof req.params === 'object' ? req.params : {})
      };

      // Convert numeric string values in query to actual numbers for filter endpoint
      if (req.path.includes('/filter')) {
        if (dataToValidate.page && typeof dataToValidate.page === 'string' && !isNaN(dataToValidate.page)) {
          dataToValidate.page = parseInt(dataToValidate.page, 10);
        }
        if (dataToValidate.limit && typeof dataToValidate.limit === 'string' && !isNaN(dataToValidate.limit)) {
          dataToValidate.limit = parseInt(dataToValidate.limit, 10);
        }
        if (dataToValidate.minPrice && typeof dataToValidate.minPrice === 'string' && !isNaN(dataToValidate.minPrice)) {
          dataToValidate.minPrice = parseFloat(dataToValidate.minPrice);
        }
        if (dataToValidate.maxPrice && typeof dataToValidate.maxPrice === 'string' && !isNaN(dataToValidate.maxPrice)) {
          dataToValidate.maxPrice = parseFloat(dataToValidate.maxPrice);
        }
      }
    } else {
      // For POST/PUT/PATCH, validate body (and maybe query for filter endpoints)
      dataToValidate = {
        ...(req.body && typeof req.body === 'object' ? req.body : {}),
        ...(req.query && typeof req.query === 'object' ? req.query : {}),
        ...(req.params && typeof req.params === 'object' ? req.params : {})
      };
    }

    const { error } = schema.validate(dataToValidate, { abortEarly: false, stripUnknown: true });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.length > 0 ? detail.path[0] : '',
        message: detail.message,
        type: detail.type
      }));

      console.log('[VALIDATION ERROR]', errors); // Log validation errors for debugging
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
};

module.exports = { validate };
