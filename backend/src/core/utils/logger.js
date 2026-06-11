/**
 * Structured logging utility.
 * Fallback to console if no external logger configured.
 * Swap Pino/Winston later by changing the adapter.
 */

const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.info;

function formatTimestamp() {
  return new Date().toISOString();
}

function log(level, message, meta = {}) {
  if (LOG_LEVELS[level] > currentLevel) return;

  const entry = {
    timestamp: formatTimestamp(),
    level,
    message,
    ...meta,
  };

  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(JSON.stringify(entry));
}

const logger = {
  error: (msg, meta) => log("error", msg, meta),
  warn: (msg, meta) => log("warn", msg, meta),
  info: (msg, meta) => log("info", msg, meta),
  debug: (msg, meta) => log("debug", msg, meta),
};

/**
 * Express middleware — log request duration + status.
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    logger.info(`${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: Date.now() - start,
      userId: req.user?.id || null,
    });
  });
  next();
}

module.exports = { logger, requestLogger };
