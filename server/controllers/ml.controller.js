const logger = require("../utils/logger");
/**
 * IntelliStock ML Controller
 * --------------------------------------------------
 * Handles:
 *  - ML model training
 *  - Global forecast
 *  - Global reorder suggestions
 *  - Per-product reorder suggestions
 *  - Automatic notification creation
 */

const axios = require("axios");
const pool = require("../db/db");
const { createNotification } = require("../utils/notification.helper");

const ML_BASE_URL = "http://127.0.0.1:8000";

const getConfiguredApiKey = () => {
  const apiKey = process.env.ML_API_KEY;
  if (!apiKey) {
    return null;
  }
  return apiKey;
};

const fetchProductForecastPayload = async (apiKey) => {
  const forecastResponse = await axios.get(
    `${ML_BASE_URL}/product-forecast`,
    {
      headers: { "X-API-Key": apiKey }
    }
  );
  return forecastResponse.data || {};
};

const fetchMlEndpoint = async (path, apiKey, req, res, errorMessage, responseBuilder) => {
  try {
    if (!apiKey) {
      return res.status(500).json({ success: false, message: "ML_API_KEY is not configured" });
    }

    const mlResponse = await axios.get(`${ML_BASE_URL}${path}`, {
      headers: { "X-API-Key": apiKey }
    });

    return res.status(200).json({
      success: true,
      ...responseBuilder(mlResponse.data || {})
    });
  } catch (error) {
    logger.error(`${errorMessage} error`, { message: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: errorMessage,
      details: error.response?.data || error.message
    });
  }
};

const buildReorderSuggestions = async () => {
  const apiKey = getConfiguredApiKey();
  if (!apiKey) {
    return { error: { status: 500, message: "ML_API_KEY is not configured" } };
  }

  const forecastPayload = await fetchProductForecastPayload(apiKey);
  const forecastByProduct = forecastPayload.product_forecasts || {};
  const metadata = forecastPayload.metadata || {};
  const insufficientMap = new Map(
    (metadata.insufficient_products || []).map((entry) => [String(entry.product_id), entry])
  );

  const productsResult = await pool.query(
    "SELECT id, name, stock_quantity, reorder_level FROM products WHERE is_active = TRUE"
  );

  const suggestions = [];
  for (const product of productsResult.rows) {
    const forecastEntry = forecastByProduct[product.id] || forecastByProduct[String(product.id)] || null;
    const insufficientEntry = insufficientMap.get(String(product.id));

    const forecastDemand = Number(forecastEntry?.forecast_total_next_7_days || 0);
    const reorderShortfall = Math.max(Number(product.reorder_level) - Number(product.stock_quantity), 0);
    const demandShortfall = Math.max(forecastDemand - Number(product.stock_quantity), 0);
    const reorderQuantity = Math.max(reorderShortfall, demandShortfall, 0);
    const reorderRequired = reorderQuantity > 0;

    const forecastSource = forecastEntry ? "model" : "insufficient_data";
    const forecastConfidence = Number(forecastEntry?.confidence || 0);
    const historyPoints = Number(forecastEntry?.history_points || insufficientEntry?.history_points || 0);
    const minimumHistoryPoints = Number(
      metadata.minimum_history_points || insufficientEntry?.minimum_required || 0
    );

    if (reorderRequired) {
      await createNotification(
        `Reorder required for '${product.name}'. Source=${forecastSource}, forecast=${forecastDemand.toFixed(2)}, stock=${product.stock_quantity}, reorder quantity=${reorderQuantity}.`,
        "admin"
      );
    }

    suggestions.push({
      product_id: product.id,
      product_name: product.name,
      forecast_demand_next_7_days: forecastDemand,
      forecast_source: forecastSource,
      forecast_confidence: forecastConfidence,
      forecast_history_points: historyPoints,
      minimum_history_points: minimumHistoryPoints,
      insufficient_data: forecastSource === "insufficient_data",
      stock_quantity: product.stock_quantity,
      reorder_level: product.reorder_level,
      reorder_quantity: reorderQuantity,
      reorder_required: reorderRequired
    });
  }

  return {
    suggestions,
    metadata: {
      minimum_history_points: metadata.minimum_history_points || 0,
      sufficient_products: metadata.sufficient_products || 0,
      insufficient_products: metadata.insufficient_products || []
    }
  };
};

/* ============================================================
   🔹 TRAIN MODEL (Admin Only)
============================================================ */
const trainModel = async (req, res) => {
  try {
    const apiKey = getConfiguredApiKey();

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "ML_API_KEY is not configured"
      });
    }

    const mlResponse = await axios.post(
      `${ML_BASE_URL}/train-model`,
      {},
      {
        headers: { "X-API-Key": apiKey }
      }
    );

    return res.status(200).json({
      success: true,
      message: "Model trained successfully ✅",
      result: mlResponse.data
    });

  } catch (error) {
    logger.error("Train Model Error error", { message: error.message, stack: error.stack });

    return res.status(500).json({
      success: false,
      message: "Failed to train model",
      details: error.response?.data || error.message
    });
  }
};

/* ============================================================
   🔹 GLOBAL FORECAST (Admin Only)
============================================================ */
const getForecast = async (req, res) => {
  try {
    const apiKey = getConfiguredApiKey();

    if (!apiKey) {
      return res.status(500).json({ success: false, message: "ML_API_KEY is not configured" });
    }

    const mlResponse = await axios.get(
      `${ML_BASE_URL}/forecast`,
      {
        headers: { "X-API-Key": apiKey }
      }
    );

    return res.status(200).json({
      success: true,
      message: "Forecast fetched successfully ✅",
      forecast: mlResponse.data
    });

  } catch (error) {
    logger.error("Forecast Error error", { message: error.message, stack: error.stack });

    return res.status(500).json({
      success: false,
      message: "Failed to fetch forecast",
      details: error.response?.data || error.message
    });
  }
};

/* ============================================================
   🔹 GLOBAL SMART REORDER (Admin Only)
============================================================ */
const getReorderSuggestions = async (req, res) => {
  try {
    const result = await buildReorderSuggestions();
    if (result.error) {
      return res.status(result.error.status).json({ success: false, message: result.error.message });
    }

    return res.status(200).json({
      success: true,
      message: "Global reorder suggestions generated ✅",
      suggestions: result.suggestions,
      forecast_metadata: result.metadata
    });

  } catch (error) {
    logger.error("Reorder Error error", { message: error.message, stack: error.stack });

    return res.status(500).json({
      success: false,
      message: "Failed to generate reorder suggestions",
      details: error.response?.data || error.message
    });
  }
};

/* ============================================================
   🔹 PER-PRODUCT SMART REORDER (Admin Only)
============================================================ */
const getProductReorderSuggestions = async (req, res) => {
  try {
    const result = await buildReorderSuggestions();
    if (result.error) {
      return res.status(result.error.status).json({ success: false, message: result.error.message });
    }

    return res.status(200).json({
      success: true,
      message: "Per-product reorder suggestions generated ✅",
      suggestions: result.suggestions,
      forecast_metadata: result.metadata
    });

  } catch (error) {
    logger.error("Product Reorder Error error", { message: error.message, stack: error.stack });

    return res.status(500).json({
      success: false,
      message: "Failed to generate per-product reorder suggestions",
      details: error.response?.data || error.message
    });
  }
};

/* ============================================================
   🔹 TREND ANALYSIS (Admin Only)
============================================================ */
const getTrendAnalysis = async (req, res) => {
  const apiKey = getConfiguredApiKey();
  return fetchMlEndpoint(
    "/trend-analysis",
    apiKey,
    req,
    res,
    "Failed to fetch trend analysis",
    (data) => ({
      message: "Trend analysis fetched successfully ✅",
      trend_analysis: data
    })
  );
};

/* ============================================================
   🔹 MOVING AVERAGE (Admin Only)
============================================================ */
const getMovingAverage = async (req, res) => {
  const apiKey = getConfiguredApiKey();
  return fetchMlEndpoint(
    "/moving-average",
    apiKey,
    req,
    res,
    "Failed to fetch moving average",
    (data) => ({
      message: "Moving average fetched successfully ✅",
      moving_average: data
    })
  );
};

/* ============================================================
   🔹 SEASONALITY ANALYSIS (Admin Only)
============================================================ */
const getSeasonalityAnalysis = async (req, res) => {
  const apiKey = getConfiguredApiKey();
  return fetchMlEndpoint(
    "/seasonality-analysis",
    apiKey,
    req,
    res,
    "Failed to fetch seasonality analysis",
    (data) => ({
      message: "Seasonality analysis fetched successfully ✅",
      seasonality: data
    })
  );
};

/* ============================================================
   🔹 ANOMALY DETECTION (Admin Only)
============================================================ */
const getAnomalyDetection = async (req, res) => {
  const apiKey = getConfiguredApiKey();
  return fetchMlEndpoint(
    "/anomaly-detection",
    apiKey,
    req,
    res,
    "Failed to fetch anomaly detection",
    (data) => ({
      message: "Anomaly detection fetched successfully ✅",
      anomalies: data
    })
  );
};

/* ============================================================
   🔹 FORECAST VS ACTUAL (Admin Only)
============================================================ */
const getForecastVsActual = async (req, res) => {
  const apiKey = getConfiguredApiKey();
  return fetchMlEndpoint(
    "/forecast-vs-actual",
    apiKey,
    req,
    res,
    "Failed to fetch forecast accuracy",
    (data) => ({
      message: "Forecast accuracy fetched successfully ✅",
      forecast_accuracy: data
    })
  );
};

/* ============================================================
   🔹 GROWTH RATE (Admin Only)
============================================================ */
const getGrowthRate = async (req, res) => {
  const apiKey = getConfiguredApiKey();
  return fetchMlEndpoint(
    "/growth-rate",
    apiKey,
    req,
    res,
    "Failed to fetch growth rate",
    (data) => ({
      message: "Growth rate fetched successfully ✅",
      growth_rate: data
    })
  );
};

/* ============================================================
   🔹 SALES ANALYTICS SNAPSHOT (Admin Only)
============================================================ */
const getSalesAnalytics = async (req, res) => {
  try {
    const apiKey = getConfiguredApiKey();
    if (!apiKey) {
      return res.status(500).json({ success: false, message: "ML_API_KEY is not configured" });
    }

    const [trend, movingAverage, anomalies, forecastAccuracy, growthRate] = await Promise.allSettled([
      axios.get(`${ML_BASE_URL}/trend-analysis`, { headers: { "X-API-Key": apiKey } }),
      axios.get(`${ML_BASE_URL}/moving-average`, { headers: { "X-API-Key": apiKey } }),
      axios.get(`${ML_BASE_URL}/anomaly-detection`, { headers: { "X-API-Key": apiKey } }),
      axios.get(`${ML_BASE_URL}/forecast-vs-actual`, { headers: { "X-API-Key": apiKey } }),
      axios.get(`${ML_BASE_URL}/growth-rate`, { headers: { "X-API-Key": apiKey } })
    ]);

    const unwrap = (result) => (result.status === "fulfilled" ? result.value.data : null);

    return res.status(200).json({
      success: true,
      message: "Sales analytics snapshot generated ✅",
      analytics: {
        trend: unwrap(trend),
        moving_average: unwrap(movingAverage),
        anomalies: unwrap(anomalies),
        forecast_accuracy: unwrap(forecastAccuracy),
        growth_rate: unwrap(growthRate)
      }
    });
  } catch (error) {
    logger.error("Sales analytics error", { message: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: "Failed to generate sales analytics snapshot",
      details: error.response?.data || error.message
    });
  }
};

/* ============================================================
   🔹 PREDICT DEMAND FOR A PRODUCT (Admin Only)
============================================================ */
const predictDemand = async (req, res) => {
  try {
    const productId = Number(req.body?.productId);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ success: false, message: "Valid productId is required" });
    }

    const result = await buildReorderSuggestions();
    if (result.error) {
      return res.status(result.error.status).json({ success: false, message: result.error.message });
    }

    const suggestion = result.suggestions.find((item) => Number(item.product_id) === productId);
    if (!suggestion) {
      return res.status(404).json({ success: false, message: "Product not found in reorder suggestions" });
    }

    return res.status(200).json({
      success: true,
      message: "Demand prediction fetched successfully ✅",
      prediction: suggestion
    });
  } catch (error) {
    logger.error("Predict demand error", { message: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: "Failed to predict demand",
      details: error.response?.data || error.message
    });
  }
};

/* ============================================================
   🔹 BEST SELLERS (Admin Only)
============================================================ */
const getBestSellers = async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 10, 50));

    const result = await pool.query(
      `
      SELECT
        p.id,
        p.name,
        COALESCE(SUM(s.quantity), 0) AS total_sold,
        COALESCE(SUM(s.total_amount), 0) AS revenue
      FROM products p
      LEFT JOIN sales s ON s.product_id = p.id
      WHERE p.is_active = TRUE
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT $1
      `,
      [limit]
    );

    return res.status(200).json({
      success: true,
      message: "Best sellers fetched successfully ✅",
      best_sellers: result.rows
    });
  } catch (error) {
    logger.error("Best sellers error", { message: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch best sellers",
      details: error.message
    });
  }
};

/* ============================================================
   🔹 INVENTORY OPTIMIZATION (Admin Only)
============================================================ */
const getInventoryOptimization = async (req, res) => {
  try {
    const result = await buildReorderSuggestions();
    if (result.error) {
      return res.status(result.error.status).json({ success: false, message: result.error.message });
    }

    const atRisk = result.suggestions.filter((item) => item.reorder_required);
    const forecastBacked = result.suggestions.filter((item) => item.forecast_source === "model").length;

    return res.status(200).json({
      success: true,
      message: "Inventory optimization snapshot generated ✅",
      optimization: {
        total_products: result.suggestions.length,
        reorder_required_products: atRisk.length,
        model_backed_products: forecastBacked,
        suggestions: result.suggestions
      },
      forecast_metadata: result.metadata
    });
  } catch (error) {
    logger.error("Inventory optimization error", { message: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: "Failed to generate inventory optimization",
      details: error.message
    });
  }
};

module.exports = {
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
};
