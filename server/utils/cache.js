const logger = require('./logger');

let client = null;
const redisUrl = process.env.REDIS_URL;

// Only initialize Redis client if REDIS_URL is configured
if (redisUrl) {
  const { createClient } = require('redis');
  client = createClient({
    url: redisUrl,
    socket: {
      reconnect: false
    }
  });

  client.on('error', (err) => {
    logger.error('Redis Client Error:', err);
  });

  client.on('connect', () => {
    logger.info('Redis client connected');
  });
} else {
  logger.info('Redis caching disabled (REDIS_URL not set)');
}

const connectRedis = async () => {
  if (!client) {
    logger.debug('Redis client not configured, skipping connection');
    return;
  }
  try {
    await client.connect();
    logger.info('Successfully connected to Redis');
  } catch (err) {
    logger.error('Failed to connect to Redis:', err);
    // Disable client further to prevent repeated errors
    client = null;
    // Application can continue without caching
  }
};

// Get cached data by key
const getCache = async (key) => {
  if (!client) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error('Redis get error:', { key, error: err.message });
    return null;
  }
};

// Set cache with TTL in seconds (default 5 minutes)
const setCache = async (key, value, ttlSeconds = 300) => {
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (err) {
    logger.error('Redis set error:', { key, error: err.message });
  }
};

// Delete a specific cache key
const delCache = async (key) => {
  if (!client) return;
  try {
    await client.del(key);
  } catch (err) {
    logger.error('Redis del error:', { key, error: err.message });
  }
};

// Delete all keys matching a pattern (e.g., 'products:*')
const delPattern = async (pattern) => {
  if (!client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
      logger.debug(`Deleted ${keys.length} cache keys matching pattern: ${pattern}`);
    }
  } catch (err) {
    logger.error('Redis delPattern error:', { pattern, error: err.message });
  }
};

module.exports = {
  client,
  connectRedis,
  getCache,
  setCache,
  delCache,
  delPattern
};
