import fs from "fs/promises";
import mongoose from "mongoose";
import { Dataset } from "../models/Dataset.js";
import { Transaction } from "../models/Transaction.js";
import { parseFile } from "../services/parser.service.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

// POST /api/datasets
export const uploadDataset = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("No file uploaded");

  const { originalname, mimetype, path: tmpPath, size } = req.file;
  const ext = originalname.split(".").pop().toLowerCase();

  if (!["csv", "xlsx"].includes(ext)) {
    await fs.unlink(tmpPath).catch(() => {});
    throw ApiError.badRequest("Only CSV and XLSX files are supported");
  }

  // Create dataset doc immediately so client gets an ID
  const dataset = await Dataset.create({
    user: req.user._id,
    name: req.body.name || originalname.replace(/\.[^.]+$/, ""),
    originalFilename: originalname,
    fileType: ext,
    fileSizeBytes: size,
    status: "parsing",
    description: req.body.description,
  });

  // Parse asynchronously (don't block the response)
  setImmediate(async () => {
    try {
      const buffer = await fs.readFile(tmpPath);
      const { rows, columnNames, detectedTypes } = await parseFile(buffer, ext);

      // Bulk-insert transactions in batches of 500
      const BATCH = 500;
      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH).map((row) => ({
          dataset: dataset._id,
          rowNumber: row.rowNumber,
          transactionId: row.transactionId ?? null,
          date: row.date ?? null,
          vendor: row.vendor ?? null,
          amount: row.amount != null
            ? mongoose.Types.Decimal128.fromString(String(row.amount))
            : null,
          invoiceId: row.invoiceId ?? null,
          category: row.category ?? null,
          rawData: row.rawData,
        }));

        await Transaction.insertMany(batch, { ordered: false });
      }

      await Dataset.findByIdAndUpdate(dataset._id, {
        status: "indexed",
        rowCount: rows.length,
        columnNames,
        detectedTypes,
      });

      logger.info(`[dataset] Indexed dataset=${dataset._id} rows=${rows.length}`);
    } catch (err) {
      logger.error(`[dataset] Parse failed for dataset=${dataset._id}: ${err.message}`);
      await Dataset.findByIdAndUpdate(dataset._id, {
        status: "failed",
        errorMessage: err.message,
      });
    } finally {
      await fs.unlink(tmpPath).catch(() => {});
    }
  });

  res.status(202).json({ success: true, dataset });
});

// GET /api/datasets
export const listDatasets = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const [datasets, total] = await Promise.all([
    Dataset.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Dataset.countDocuments({ user: req.user._id }),
  ]);

  res.json({ success: true, datasets, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/datasets/:id
export const getDataset = asyncHandler(async (req, res) => {
  const dataset = await Dataset.findOne({ _id: req.params.id, user: req.user._id });
  if (!dataset) throw ApiError.notFound("Dataset");
  res.json({ success: true, dataset });
});

// DELETE /api/datasets/:id
export const deleteDataset = asyncHandler(async (req, res) => {
  const dataset = await Dataset.findOne({ _id: req.params.id, user: req.user._id });
  if (!dataset) throw ApiError.notFound("Dataset");

  await Transaction.deleteMany({ dataset: dataset._id });
  await dataset.deleteOne();

  res.json({ success: true, message: "Dataset deleted" });
});

// GET /api/datasets/:id/rows  (preview first N rows)
export const previewRows = asyncHandler(async (req, res) => {
  const dataset = await Dataset.findOne({ _id: req.params.id, user: req.user._id });
  if (!dataset) throw ApiError.notFound("Dataset");

  const limit = Math.min(500, parseInt(req.query.limit) || 100);
  const rows = await Transaction.find({ dataset: dataset._id })
    .sort({ rowNumber: 1 })
    .limit(limit);

  res.json({ success: true, rows });
});
