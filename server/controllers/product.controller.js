const pool = require("../db/db");

// Pagination and limit constants
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 500;
const SEARCH_DEFAULT_LIMIT = 100;
const SEARCH_MAX_LIMIT = 500;
const FILTER_DEFAULT_LIMIT = 20;
const FILTER_MAX_LIMIT = 100;
const logger = require("../utils/logger");
const { sanitizeProductData } = require("../utils/sanitize");
const { getCache, setCache, delPattern } = require("../utils/cache");

// ── Add Product ───────────────────────────────────────────────────────────────
const addProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      brand,
      cost_price,
      selling_price,
      stock_quantity,
      expiry_date,
      image_url,
      delete_existing_image
    } = req.body;

    // Sanitize text fields to prevent XSS
    const sanitized = sanitizeProductData({ name, category, brand });
    name = sanitized.name;
    category = sanitized.category;
    brand = sanitized.brand;

    let finalImageUrl = image_url || null;

    // If req.file exists, multer already uploaded it and compressed it
    // The filename is already in req.file.filename
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    if (!name || cost_price == null || selling_price == null || stock_quantity == null) {
      return res.status(400).json({
        message: "name, cost_price, selling_price, and stock_quantity are required"
      });
    }

    if (selling_price < 0 || cost_price < 0 || stock_quantity < 0) {
      return res.status(400).json({ message: "Prices and stock quantity must be non-negative" });
    }

    const result = await pool.query(
      `INSERT INTO products
       (name, category, brand, cost_price, selling_price, stock_quantity, expiry_date, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, category, brand, cost_price, selling_price, stock_quantity, expiry_date || null, finalImageUrl]
    );

    // Invalidate caches after product creation
    await delPattern('products:*');
    await delPattern('products:metadata');
    await delPattern('dashboard:stats');

    res.status(201).json({ success: true, message: "Product added successfully", product: result.rows[0] });

  } catch (error) {
    logger.error("addProduct:", error.message);
    res.status(500).json({ success: false, message: "Server error", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Update Product ───────────────────────────────────────────────────────────────
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let {
      name,
      category,
      brand,
      cost_price,
      selling_price,
      stock_quantity,
      expiry_date,
      image_url,
      delete_existing_image
    } = req.body;

    // Sanitize text fields to prevent XSS
    const sanitized = sanitizeProductData({ name, category, brand });
    name = sanitized.name;
    category = sanitized.category;
    brand = sanitized.brand;

    // Fetch existing product to check for old image
    const existingProduct = await pool.query('SELECT image_url FROM products WHERE id=$1', [id]);
    const oldImageUrl = existingProduct.rows[0]?.image_url;

    // Determine final image URL
    let finalImageUrl = oldImageUrl; // Start with existing

    if (delete_existing_image === 'true') {
      // Explicitly delete image
      finalImageUrl = null;
    } else if (req.file) {
      // New image uploaded
      finalImageUrl = `/uploads/${req.file.filename}`;
    } else if (image_url) {
      // External image URL provided
      finalImageUrl = image_url;
    }
    // else: keep existing (finalImageUrl already = oldImageUrl)

    if (!name || cost_price == null || selling_price == null || stock_quantity == null) {
      return res.status(400).json({
        message: "name, cost_price, selling_price, and stock_quantity are required"
      });
    }

    if (selling_price < 0 || cost_price < 0 || stock_quantity < 0) {
      return res.status(400).json({ message: "Prices and stock quantity must be non-negative" });
    }

    const result = await pool.query(
      `UPDATE products SET name=$1, category=$2, brand=$3, cost_price=$4, selling_price=$5, stock_quantity=$6, expiry_date=$7, image_url=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [name, category, brand, cost_price, selling_price, stock_quantity, expiry_date || null, finalImageUrl, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Delete old image file asynchronously if it exists and we're replacing/removing it
    if (oldImageUrl && oldImageUrl !== finalImageUrl) {
      const fs = require('fs');
      const path = require('path');
      const oldImagePath = path.resolve(__dirname, '..', '.' + oldImageUrl);
      try {
        await fs.promises.unlink(oldImagePath);
      } catch (unlinkError) {
        if (unlinkError.code !== 'ENOENT') {
          logger.error('Failed to delete old image:', unlinkError.message);
        }
        // Don't fail the request if delete fails
      }
    }

    // Invalidate caches after product update
    await delPattern('products:*');
    await delPattern('products:metadata');
    await delPattern('dashboard:stats');

    res.status(200).json({ success: true, message: "Product updated successfully", product: result.rows[0] });

  } catch (error) {
    logger.error("updateProduct:", error.message);
    res.status(500).json({ success: false, message: "Server error", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Delete Product ───────────────────────────────────────────────────────────────
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // First, delete the image file asynchronously if exists
    const product = await pool.query('SELECT image_url FROM products WHERE id=$1', [id]);
    if (product.rows[0]?.image_url) {
      const fs = require('fs');
      const path = require('path');
      const imagePath = path.resolve(__dirname, '..', '.' + product.rows[0].image_url);
      try {
        await fs.promises.unlink(imagePath);
      } catch (unlinkError) {
        if (unlinkError.code !== 'ENOENT') {
          logger.error('Failed to delete product image:', unlinkError.message);
        }
      }
    }

    const result = await pool.query('DELETE FROM products WHERE id=$1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Invalidate caches after product deletion
    await delPattern('products:*');
    await delPattern('products:metadata');
    await delPattern('dashboard:stats');

    res.status(200).json({ success: true, message: "Product deleted successfully" });

  } catch (error) {
    logger.error("deleteProduct:", error.message);
    res.status(500).json({ success: false, message: "Server error", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Get Product Image ─────────────────────────────────────────────────────────────
const getProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await pool.query('SELECT image_url FROM products WHERE id=$1', [id]);

    if (!product.rows[0] || !product.rows[0].image_url) {
      return res.status(404).json({ success: false, message: "Image not found" });
    }

    const fs = require('fs');
    const path = require('path');
    const imagePath = path.resolve(__dirname, '..', '.' + product.rows[0].image_url);

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ success: false, message: "Image file not found" });
    }

    res.sendFile(imagePath);

  } catch (error) {
    logger.error("getProductImage:", error.message);
    res.status(500).json({ success: false, message: "Server error", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Delete Product Image ──────────────────────────────────────────────────────────
const deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Get current product to check image
    const product = await pool.query('SELECT image_url FROM products WHERE id=$1', [id]);
    if (!product.rows[0]) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // If product has an existing image, delete it asynchronously
    if (product.rows[0].image_url) {
      const fs = require('fs');
      const path = require('path');
      const oldImagePath = path.resolve(__dirname, '..', '.' + product.rows[0].image_url);

      try {
        await fs.promises.unlink(oldImagePath);
      } catch (unlinkError) {
        if (unlinkError.code !== 'ENOENT') {
          logger.error('Failed to delete image:', unlinkError.message);
        }
      }
    }

    // Clear image_url from database
    const result = await pool.query(
      'UPDATE products SET image_url = NULL WHERE id=$1 RETURNING *',
      [id]
    );

    // If a new image was uploaded in this request, it's already saved by addProduct/updateProduct logic
    // We only cleared the old one, so the new one (if any) stays

    res.status(200).json({
      success: true,
      message: "Product image deleted successfully",
      product: result.rows[0]
    });

  } catch (error) {
    logger.error("deleteProductImage:", error.message);
    res.status(500).json({ success: false, message: "Server error", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Get All Products (with pagination) ───────────────────────────────────────
const getProducts = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(MAX_LIMIT, parseInt(req.query.limit) || DEFAULT_LIMIT);
    const offset = (page - 1) * limit;

    // Check cache first
    const cacheKey = `products:page:${page}:limit:${limit}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        "SELECT * FROM products WHERE is_active = TRUE ORDER BY created_at DESC LIMIT $1 OFFSET $2",
        [limit, offset]
      ),
      pool.query("SELECT COUNT(*) FROM products WHERE is_active = TRUE")
    ]);

    const responseData = {
      success: true,
      message: "Products retrieved successfully",
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      products: dataResult.rows
    };

    // Cache response for 5 minutes (300 seconds)
    await setCache(cacheKey, responseData, 300);

    res.status(200).json(responseData);

  } catch (error) {
    logger.error("getProducts:", error.message);
    res.status(500).json({ success: false, message: "Server error", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Search Products by Name/SKU/Category/Brand ──────────────────────────────
const searchProducts = async (req, res) => {
  try {
    const { q, limit = 100 } = req.query;
    
    if (!q || !q.trim()) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const searchQuery = `%${q.trim()}%`;
    
    const result = await pool.query(`
      SELECT *
      FROM products
      WHERE is_active = TRUE
        AND (
          LOWER(name) LIKE LOWER($1)
          OR LOWER(sku) LIKE LOWER($1)
          OR LOWER(category) LIKE LOWER($1)
          OR LOWER(brand) LIKE LOWER($1)
        )
      ORDER BY name ASC
      LIMIT $2
    `, [searchQuery, Math.min(parseInt(limit) || SEARCH_DEFAULT_LIMIT, SEARCH_MAX_LIMIT)]);

    res.status(200).json({
      success: true,
      message: "Search completed",
      count: result.rows.length,
      products: result.rows
    });

  } catch (error) {
    logger.error('searchProducts:', error.message);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Low Stock Products ────────────────────────────────────────────────────────
const getLowStockProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM products
      WHERE stock_quantity <= reorder_level
        AND is_active = TRUE
      ORDER BY stock_quantity ASC
    `);

    res.status(200).json({
      success: true,
      message: "Low stock products retrieved",
      count: result.rows.length,
      low_stock_products: result.rows
    });

  } catch (error) {
    logger.error("getLowStockProducts:", error.message);
    res.status(500).json({ success: false, message: "Server error", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Apply Discount to All Products ───────────────────────────────────────────
// Discount is computed from cost_price so repeated calls are idempotent.
const applyDiscountToAll = async (req, res) => {
  try {
    const { discount_percentage } = req.body;
    const pct = parseFloat(discount_percentage);

    if (isNaN(pct) || pct < 0 || pct > 100) {
      return res.status(400).json({ success: false, message: "discount_percentage must be between 0 and 100" });
    }

    await pool.query(`
      UPDATE products
      SET
        discount_percentage = $1,
        selling_price       = ROUND(cost_price * (1 - $1 / 100.0), 2),
        updated_at          = NOW()
      WHERE is_active = TRUE
    `, [pct]);

    res.status(200).json({ success: true, message: `Discount of ${pct}% applied to all active products` });

  } catch (error) {
    logger.error("applyDiscountToAll:", error.message);
    res.status(500).json({ success: false, message: "Server error", error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Filter & Sort Products (with pagination) ──────────────────────────────────
  const filterProducts = async (req, res) => {
    try {
      const {
        query,
        category,
        brand,
        minPrice,
        maxPrice,
        stockStatus,
        dateFrom,
        dateTo,
        expiryBefore,
        sortBy,
        sortOrder
      } = req.query;

      // Log incoming request for debugging
      logger.debug('[FILTER] Request params:', {
        query, category, brand, minPrice, maxPrice, stockStatus,
        dateFrom, dateTo, sortBy, sortOrder
      });

      const page  = Math.max(1, parseInt(req.query.page)  || 1);
      const limit = Math.min(FILTER_MAX_LIMIT, parseInt(req.query.limit) || FILTER_DEFAULT_LIMIT);
      const offset = (page - 1) * limit;

      let where = "WHERE is_active = TRUE";
      const values = [];
      let idx = 1;

      // Text search (name, sku, category, brand)
      if (query && query.trim()) {
        where += ` AND (
          LOWER(name) LIKE LOWER($${idx}) OR
          LOWER(sku) LIKE LOWER($${idx}) OR
          LOWER(category) LIKE LOWER($${idx}) OR
          LOWER(brand) LIKE LOWER($${idx})
        )`;
        values.push(`%${query}%`);
        idx++;
      }

      // Multiple categories (IN clause)
      const catArray = Array.isArray(category) ? category : (category ? [category] : []);
      if (catArray.length > 0) {
        const placeholders = catArray.map(() => `$${idx++}`).join(', ');
        where += ` AND category IN (${placeholders})`;
        values.push(...catArray);
      }

      // Multiple brands (IN clause)
      const brandArray = Array.isArray(brand) ? brand : (brand ? [brand] : []);
      if (brandArray.length > 0) {
        const placeholders = brandArray.map(() => `$${idx++}`).join(', ');
        where += ` AND brand IN (${placeholders})`;
        values.push(...brandArray);
      }

      // Price range
      if (minPrice) {
        const minPriceNum = parseFloat(minPrice);
        if (!isNaN(minPriceNum)) {
          where += ` AND selling_price >= $${idx++}`;
          values.push(minPriceNum);
        }
      }
      if (maxPrice) {
        const maxPriceNum = parseFloat(maxPrice);
        if (!isNaN(maxPriceNum)) {
          where += ` AND selling_price <= $${idx++}`;
          values.push(maxPriceNum);
        }
      }

      // Stock status
      if (stockStatus) {
        switch (stockStatus) {
          case 'in-stock':
            where += ` AND stock_quantity > 0`;
            break;
          case 'low-stock':
            where += ` AND stock_quantity > 0 AND stock_quantity <= reorder_level`;
            break;
          case 'out-of-stock':
            where += ` AND stock_quantity = 0`;
            break;
        }
      }

      // Date range on created_at
      let parsedFromDate = null;
      let parsedToDate = null;

      if (dateFrom) {
        parsedFromDate = new Date(dateFrom);
        if (isNaN(parsedFromDate.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid dateFrom format' });
        }
      }

      if (dateTo) {
        parsedToDate = new Date(dateTo);
        if (isNaN(parsedToDate.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid dateTo format' });
        }
      }

      // Validate date order if both provided
      if (parsedFromDate && parsedToDate && parsedFromDate > parsedToDate) {
        return res.status(400).json({ success: false, message: 'start date must be before end date' });
      }

      if (parsedFromDate) {
        where += ` AND created_at >= $${idx++}`;
        values.push(parsedFromDate.toISOString());
      }
      if (parsedToDate) {
        where += ` AND created_at <= $${idx++}`;
        values.push(parsedToDate.toISOString());
      }

      // Expiry date filter
      if (expiryBefore) {
        const expiryDate = new Date(expiryBefore);
        if (!isNaN(expiryDate.getTime())) {
          where += ` AND expiry_date <= $${idx++}`;
          values.push(expiryBefore);
        }
      }

      // Sorting
      const orderMap = {
        name: 'name',
        selling_price: 'selling_price',
        stock_quantity: 'stock_quantity',
        created_at: 'created_at'
      };
      const orderBy = orderMap[sortBy] || 'created_at';
      const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
      const fullOrderBy = `${orderBy} ${orderDirection}`;

      // Build final query with properly tracked parameter indices
      const selectQuery = `SELECT * FROM products ${where} ORDER BY ${fullOrderBy} LIMIT $${idx} OFFSET $${idx + 1}`;
      const countQuery = `SELECT COUNT(*) FROM products ${where}`;
      const selectParams = [...values, limit, offset];
      const countParams = values;

      logger.debug('[FILTER] Query:', selectQuery);
      logger.debug('[FILTER] Params:', selectParams);

      const [dataResult, countResult] = await Promise.all([
        pool.query(selectQuery, selectParams),
        pool.query(countQuery, countParams)
      ]);

      const total = parseInt(countResult.rows[0]?.count || 0);
      const products = dataResult.rows || [];

      logger.debug('[FILTER] Results:', { total, count: products.length, page, limit });

      res.status(200).json({
        success: true,
        total,
        page,
        limit,
        products
      });

    } catch (error) {
      logger.error("[FILTER ERROR]", error.message, error.stack);
      res.status(500).json({
        success: false,
        message: "Failed to filter products",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

// ── Bulk Upload Products from CSV ────────────────────────────────────────────
const uploadProductsCSV = async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const csv = require('csv-parser');

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No CSV file uploaded' });
    }

    logger.debug('[CSV UPLOAD] Starting CSV upload process:', req.file.filename);

    const filePath = req.file.path;
    const results = [];
    const errors = [];
    let rowNumber = 0;
    const MAX_CSV_ROWS = parseInt(process.env.MAX_CSV_ROWS) || 10000;
    let exceededLimit = false;

    // Generate SKU from product name
    const generateSKU = (name) => {
      return name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 20) || `SKU${Date.now()}`;
    };

    // Read and parse CSV
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        rowNumber++;
        if (rowNumber > MAX_CSV_ROWS) {
          exceededLimit = true;
          return;
        }
        results.push({ ...data, rowNumber });
      })
      .on('end', async () => {
        try {
          // Delete the uploaded file asynchronously
          await fs.promises.unlink(filePath);

          // Check if row limit was exceeded
          if (exceededLimit) {
            return res.status(400).json({
              success: false,
              message: `CSV upload exceeds maximum row limit of ${MAX_CSV_ROWS} rows. Please upload a smaller file or split your data.`
            });
          }

          // Validate and filter rows
          const validProducts = [];
          const validationErrors = [];

          for (const row of results) {
            const {
              name,
              sku,
              stock_quantity,
              price,
              cost_price,
              selling_price,
              category,
              brand,
              expiry_date,
              rowNumber
            } = row;

            // Validate required fields
            if (!name || !name.trim()) {
              validationErrors.push({ row: rowNumber, reason: 'Product name is required' });
              continue;
            }

            // Validate numeric fields
            const stockQty = parseInt(stock_quantity, 10);
            
            if (isNaN(stockQty) || stockQty < 0) {
              validationErrors.push({ row: rowNumber, reason: 'Stock quantity must be a non-negative number' });
              continue;
            }

            // Support two CSV formats:
            // Format 1: name, sku, stock_quantity, price (simple)
            // Format 2: name, cost_price, selling_price, stock_quantity, (detailed)
            let finalCostPrice, finalSellingPrice, finalSKU;

            if (cost_price && selling_price) {
              // Format 2: User provided both cost and selling price
              const costNum = parseFloat(cost_price);
              const sellingNum = parseFloat(selling_price);
              
              if (isNaN(costNum) || costNum < 0) {
                validationErrors.push({ row: rowNumber, reason: 'Cost price must be a valid non-negative number' });
                continue;
              }
              
              if (isNaN(sellingNum) || sellingNum < 0) {
                validationErrors.push({ row: rowNumber, reason: 'Selling price must be a valid non-negative number' });
                continue;
              }
              
              finalCostPrice = costNum;
              finalSellingPrice = sellingNum;
            } else if (price) {
              // Format 1: User provided single price
              const productPrice = parseFloat(price);
              
              if (isNaN(productPrice) || productPrice < 0) {
                validationErrors.push({ row: rowNumber, reason: 'Price must be a non-negative number' });
                continue;
              }
              
              finalCostPrice = productPrice * 0.6;
              finalSellingPrice = productPrice;
            } else {
              validationErrors.push({ row: rowNumber, reason: 'Either "price" or "cost_price" and "selling_price" columns are required' });
              continue;
            }

            // SKU: Use provided or generate from name
            finalSKU = (sku && sku.trim()) ? sku.trim() : generateSKU(name);

            // Sanitize text fields
            const rawCategory = (category && category.trim()) || 'Imported';
            const rawBrand = (brand && brand.trim()) || 'Various';
            const sanitized = sanitizeProductData({
              name: name.trim(),
              category: rawCategory,
              brand: rawBrand
            });

            validProducts.push({
              name: sanitized.name,
              sku: finalSKU,
              stock_quantity: stockQty,
              cost_price: finalCostPrice,
              selling_price: finalSellingPrice,
              category: sanitized.category,
              brand: sanitized.brand,
              expiry_date: (expiry_date && expiry_date.trim()) || null,
              rowNumber
            });
          }

          // Check for duplicate SKUs in the upload
          const skuMap = new Map();
          const productsToInsert = [];
          const duplicateErrors = [];

          for (const product of validProducts) {
            if (skuMap.has(product.sku)) {
              duplicateErrors.push({
                row: product.rowNumber,
                reason: `Duplicate SKU in file (first occurrence at row ${skuMap.get(product.sku)})`
              });
            } else {
              skuMap.set(product.sku, product.rowNumber);
              productsToInsert.push(product);
            }
          }

          // Check for existing SKUs in database
          const existingSKUs = new Set();
          if (productsToInsert.length > 0) {
            const skuList = productsToInsert.map(p => p.sku);
            const existingResult = await pool.query(
              'SELECT sku FROM products WHERE sku = ANY($1)',
              [skuList]
            );
            existingResult.rows.forEach(row => existingSKUs.add(row.sku));
          }

          // Separate products: new vs duplicate in DB
          const newProducts = [];
          const skippedDuplicates = [];

          for (const product of productsToInsert) {
            if (existingSKUs.has(product.sku)) {
              skippedDuplicates.push({
                row: product.rowNumber,
                reason: 'SKU already exists in database'
              });
            } else {
              newProducts.push(product);
            }
          }

          // Batch insert new products
          let insertedCount = 0;
          if (newProducts.length > 0) {
            const values = newProducts.map((p, idx) => [
              p.name,
              p.sku,
              p.category,
              p.brand,
              p.cost_price,
              p.selling_price,
              p.stock_quantity,
              null, // expiry_date
              null  // image_url
            ]);

            // Build bulk insert query
            const placeholders = values.map((_, i) => {
              const offset = i * 9;
              return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`;
            }).join(',');

            const flatValues = values.flat();

            const insertQuery = `
              INSERT INTO products (name, sku, category, brand, cost_price, selling_price, stock_quantity, expiry_date, image_url)
              VALUES ${placeholders}
              RETURNING id
            `;

            try {
              const insertResult = await pool.query(insertQuery, flatValues);
              insertedCount = insertResult.rows.length;
              logger.debug(`[CSV UPLOAD] Successfully inserted ${insertedCount} products out of ${newProducts.length} attempted`);
            } catch (insertError) {
              logger.error('[CSV UPLOAD] Insert error:', insertError.message);
              throw insertError;
            }
          }

          // Combine all errors
          const allErrors = [...validationErrors, ...duplicateErrors, ...skippedDuplicates];

          logger.debug('[CSV UPLOAD] Summary:', {
            total_rows: results.length,
            inserted: insertedCount,
            validation_errors: validationErrors.length,
            duplicate_errors: duplicateErrors.length,
            duplicate_db: skippedDuplicates.length
          });

          // Invalidate caches after CSV bulk upload
          await delPattern('products:*');
          await delPattern('products:metadata');
          await delPattern('dashboard:stats');

          res.status(200).json({
            success: true,
            message: 'CSV upload completed',
            total_rows: results.length,
            inserted: insertedCount,
            skipped: productsToInsert.length - insertedCount + validationErrors.length,
            errors: allErrors.length > 0 ? allErrors : [],
            summary: {
              invalid_format: validationErrors.length,
              duplicate_in_file: duplicateErrors.length,
              duplicate_in_db: skippedDuplicates.length,
              successfully_inserted: insertedCount
            }
          });
        } catch (parseError) {
          logger.error('CSV processing error:', parseError.message);
          // Clean up file if still exists
          try {
            await fs.promises.unlink(filePath);
          } catch (e) {}
          res.status(500).json({ success: false, message: 'Error processing CSV file', error: process.env.NODE_ENV === 'development' ? parseError.message : undefined });
        }
      })
      .on('error', (error) => {
        logger.error('CSV read error:', error.message);
        // Clean up file asynchronously (non-blocking)
        fs.unlink(filePath, () => {});
        res.status(400).json({ success: false, message: 'Invalid CSV file format', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
      });
  } catch (error) {
    logger.error('uploadProductsCSV:', error.message);
    res.status(500).json({ success: false, message: 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ── Get Distinct Categories & Brands (Metadata) ─────────────────────────────────
const getProductMetadata = async (req, res) => {
  try {
    const cacheKey = 'products:metadata';
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const [catResult, brandResult] = await Promise.all([
      pool.query(`SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != '' ORDER BY category`),
      pool.query(`SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != '' ORDER BY brand`)
    ]);
    const categories = catResult.rows.map(r => r.category);
    const brands = brandResult.rows.map(r => r.brand);
    const responseData = { success: true, categories, brands };
    await setCache(cacheKey, responseData, 3600); // Cache for 1 hour
    res.json(responseData);
  } catch (error) {
    logger.error("getProductMetadata:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch metadata" });
  }
};

module.exports = {
  addProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  searchProducts,
  getLowStockProducts,
  applyDiscountToAll,
  filterProducts,
  uploadProductsCSV,
  getProductImage,
  deleteProductImage,
  getProductMetadata
};
