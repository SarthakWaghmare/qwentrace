import { Router } from "express";
import { register, login, getMe, updateMe } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, updateMe);

export default router;
