const express = require("express");
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const logger = require("../utils/logger");
const productController = require("../controllers/product.controller");
const verifyToken = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const { productSchema, applyDiscountSchema, filterProductsSchema } = require("../validation/validation");

// Configure storage with UUID filenames and sharp optimization
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1]; // jpeg, png, webp
    cb(null, `${file.fieldname}-${uuidv4()}.${ext}`);
  }
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image files are allowed (JPEG, PNG, WebP, AVIF)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  }
});

// Middleware to compress image after upload
const compressImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const filename = req.file.filename;
    const filepath = `uploads/${filename}`;

    // Compress and convert to webp for better performance
    await sharp(filepath)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filepath);

    next();
  } catch (error) {
    logger.error('Image compression error:', error.message);
    next(); // Continue even if compression fails
  }
};

/* ================= VIEW PRODUCTS ================= */
/* Customer + Staff + Admin */
router.get(
  "/",
  verifyToken,
  authorizeRoles("customer", "staff", "admin"),
  productController.getProducts
);

/* ================= SEARCH PRODUCTS ================= */
/* Customer + Staff + Admin */
router.get(
  "/search/query",
  verifyToken,
  authorizeRoles("customer", "staff", "admin"),
  productController.searchProducts
);

/* ================= FILTER PRODUCTS ================= */
/* Customer + Staff + Admin */
router.get(
  "/filter",
  verifyToken,
  authorizeRoles("customer", "staff", "admin"),
  validate(filterProductsSchema),
  productController.filterProducts
);

/* ================= LOW STOCK ================= */
/* Staff + Admin */
router.get(
  "/low-stock",
  verifyToken,
  authorizeRoles("staff", "admin"),
  productController.getLowStockProducts
);

/* ================= ADD PRODUCT ================= */
/* Staff + Admin */
router.post(
  "/",
  verifyToken,
  authorizeRoles("staff", "admin"),
  upload.single('image'),
  compressImage,
  validate(productSchema),
  productController.addProduct
);

/* ================= UPDATE PRODUCT ================= */
/* Staff + Admin */
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("staff", "admin"),
  upload.single('image'),
  compressImage,
  validate(productSchema),
  productController.updateProduct
);

/* ================= DELETE PRODUCT ================= */
/* Staff + Admin */
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("staff", "admin"),
  productController.deleteProduct
);

/* ================= GET PRODUCT IMAGE ================= */
/* Customer + Staff + Admin */
router.get(
  "/:id/image",
  verifyToken,
  authorizeRoles("customer", "staff", "admin"),
  productController.getProductImage
);

/* ================= DELETE PRODUCT IMAGE ================= */
/* Staff + Admin */
router.delete(
  "/:id/image",
  verifyToken,
  authorizeRoles("staff", "admin"),
  productController.deleteProductImage
);

/* ================= APPLY DISCOUNT ================= */
/* Admin Only */
router.put(
  "/apply-discount",
  verifyToken,
  authorizeRoles("admin"),
  validate(applyDiscountSchema),
  productController.applyDiscountToAll
);

/* ================= BULK UPLOAD CSV ================= */
/* Admin Only */
router.post(
  "/upload-csv",
  verifyToken,
  authorizeRoles("admin"),
  upload.single('csvFile'),
  productController.uploadProductsCSV
);

/* ================= GET PRODUCT METADATA (Categories & Brands) ================= */
/* All authenticated roles can view */
router.get(
  "/metadata",
  verifyToken,
  authorizeRoles("customer", "staff", "admin"),
  productController.getProductMetadata
);

module.exports = router;