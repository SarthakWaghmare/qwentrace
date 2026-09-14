import { Router } from "express";
import {
  uploadDataset,
  listDatasets,
  getDataset,
  deleteDataset,
  previewRows,
} from "../controllers/dataset.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

// All dataset routes require authentication
router.use(requireAuth);

router.post("/", upload.single("file"), uploadDataset);
router.get("/", listDatasets);
router.get("/:id", getDataset);
router.delete("/:id", deleteDataset);
router.get("/:id/rows", previewRows);

export default router;
