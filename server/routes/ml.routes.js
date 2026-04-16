const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  trainModel,
  getForecast,
  getReorderSuggestions,
  getProductReorderSuggestions,
  getTrendAnalysis,
  getMovingAverage,
  getSeasonalityAnalysis,
  getAnomalyDetection,
  getForecastVsActual,
  getGrowthRate,
  getSalesAnalytics,
  predictDemand,
  getBestSellers,
  getInventoryOptimization
} = require("../controllers/ml.controller");


/* ============================================================
   🔹 TRAIN MODEL (Admin Only)
============================================================ */
router.post(
  "/train-model",
  verifyToken,
  authorizeRoles("admin"),
  trainModel
);


/* ============================================================
   🔹 GLOBAL FORECAST (Admin Only)
============================================================ */
router.get(
  "/forecast",
  verifyToken,
  authorizeRoles("admin"),
  getForecast
);


/* ============================================================
   🔹 GLOBAL REORDER SUGGESTIONS (Admin Only)
============================================================ */
router.get(
  "/reorder-suggestions",
  verifyToken,
  authorizeRoles("admin"),
  getReorderSuggestions
);


/* ============================================================
   🔹 PER-PRODUCT REORDER SUGGESTIONS (Admin Only)
============================================================ */
router.get(
  "/product-reorder-suggestions",
  verifyToken,
  authorizeRoles("admin"),
  getProductReorderSuggestions
);

router.get(
  "/trend-analysis",
  verifyToken,
  authorizeRoles("admin"),
  getTrendAnalysis
);

router.get(
  "/moving-average",
  verifyToken,
  authorizeRoles("admin"),
  getMovingAverage
);

router.get(
  "/seasonality-analysis",
  verifyToken,
  authorizeRoles("admin"),
  getSeasonalityAnalysis
);

router.get(
  "/anomaly-detection",
  verifyToken,
  authorizeRoles("admin"),
  getAnomalyDetection
);

router.get(
  "/forecast-vs-actual",
  verifyToken,
  authorizeRoles("admin"),
  getForecastVsActual
);

router.get(
  "/growth-rate",
  verifyToken,
  authorizeRoles("admin"),
  getGrowthRate
);

router.get(
  "/sales-analytics",
  verifyToken,
  authorizeRoles("admin"),
  getSalesAnalytics
);

router.post(
  "/predict-demand",
  verifyToken,
  authorizeRoles("admin"),
  predictDemand
);

router.get(
  "/best-sellers",
  verifyToken,
  authorizeRoles("admin"),
  getBestSellers
);

router.get(
  "/inventory-optimization",
  verifyToken,
  authorizeRoles("admin"),
  getInventoryOptimization
);


module.exports = router;