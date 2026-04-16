const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Store original methods
  const originalSend = res.send;
  const originalJson = res.json;
  const originalStatus = res.status;

  // Hook into res.json to log after response is sent
  res.send = function(body) {
    const duration = Date.now() - start;
    const status = res.statusCode;

    const logData = {
      method: req.method,
      url: req.originalUrl,
      status,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      contentLength: body ? (typeof body === 'string' ? body.length : JSON.stringify(body).length) : 0
    };

    // Log level based on status code
    if (status >= 500) {
      logger.error('HTTP Request', logData);
    } else if (status >= 400) {
      logger.warn('HTTP Request (Client Error)', logData);
    } else {
      logger.info('HTTP Request', logData);
    }

    return originalSend.call(this, body);
  };

  // Also hook res.json (which often calls res.send internally, but just in case)
  res.json = function(body) {
    const duration = Date.now() - start;
    const status = res.statusCode;

    const logData = {
      method: req.method,
      url: req.originalUrl,
      status,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      contentType: 'application/json'
    };

    if (status >= 500) {
      logger.error('HTTP Request (JSON)', logData);
    } else if (status >= 400) {
      logger.warn('HTTP Request (JSON) (Client Error)', logData);
    } else {
      logger.info('HTTP Request (JSON)', logData);
    }

    return originalJson.call(this, body);
  };

  next();
};

module.exports = requestLogger;
