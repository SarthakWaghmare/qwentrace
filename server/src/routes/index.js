import { Router } from "express";
import authRoutes from "./auth.routes.js";
import datasetRoutes from "./dataset.routes.js";
import queryRoutes from "./query.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/datasets", datasetRoutes);
router.use("/queries", queryRoutes);

// Health check
router.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok", timestamp: new Date().toISOString() });
});

export default router;
