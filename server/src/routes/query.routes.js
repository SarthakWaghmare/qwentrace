import { Router } from "express";
import { askQuestion, listQueries, getQuery } from "../controllers/query.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { queryLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.use(requireAuth);

router.post("/", queryLimiter, askQuestion);
router.get("/", listQueries);
router.get("/:id", getQuery);

export default router;
