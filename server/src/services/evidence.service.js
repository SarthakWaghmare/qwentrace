import { Evidence } from "../models/Evidence.js";
import { Transaction } from "../models/Transaction.js";
import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

/**
 * Create an Evidence record for a completed query.
 * Also fetches and snapshots the cited transactions for auditability.
 *
 * @param {{ queryId, datasetId, userId, answerJson }} param0
 */
export async function createEvidence({ queryId, datasetId, userId, answerJson }) {
  const { conclusion, sourceRows = [], computations = [], confidence } = answerJson;

  logger.info(`[evidence] Creating evidence for query=${queryId}, sourceRows=${sourceRows.length}`);

  // Snapshot the actual transactions cited
  let citedTransactions = [];
  if (sourceRows.length > 0) {
    const docs = await Transaction.find({
      dataset: new mongoose.Types.ObjectId(datasetId),
      rowNumber: { $in: sourceRows },
    })
      .lean()
      .select({ _id: 0 });

    citedTransactions = docs.map((d) => ({
      ...d,
      amount: d.amount?.$numberDecimal ? parseFloat(d.amount.$numberDecimal) : d.amount,
      rawData: d.rawData instanceof Map ? Object.fromEntries(d.rawData) : d.rawData,
    }));
  }

  const evidence = await Evidence.create({
    query: queryId,
    dataset: datasetId,
    user: userId,
    conclusion,
    sourceRows,
    computations,
    confidence: typeof confidence === "number" ? confidence : null,
    citedTransactions,
  });

  logger.info(`[evidence] Created evidence=${evidence._id}`);
  return evidence;
}
