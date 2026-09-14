import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Log unexpected errors
  if (!err.isOperational) {
    logger.error(`[errorHandler] Unexpected error: ${err.stack || err.message}`);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, error: "Validation error", details });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(", ");
    return res.status(409).json({ success: false, error: `Duplicate value for: ${field}` });
  }

  // Mongoose CastError (invalid ObjectId etc.)
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, error: `Invalid value for field: ${err.path}` });
  }

  // Our structured API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Multer file size / unexpected errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, error: "File too large" });
  }

  // Fallback 500
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
}
