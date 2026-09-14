import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Middleware: validate JWT Bearer token and attach req.user.
 */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw ApiError.unauthorized("No token provided");
  }

  const token = header.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    throw ApiError.unauthorized(
      err.name === "TokenExpiredError" ? "Token expired" : "Invalid token"
    );
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized("User no longer exists");

  req.user = user;
  next();
});

/**
 * Middleware: only allow admin role.
 */
export const requireAdmin = (req, _res, next) => {
  if (req.user?.role !== "admin") {
    throw ApiError.forbidden("Admin access required");
  }
  next();
};
