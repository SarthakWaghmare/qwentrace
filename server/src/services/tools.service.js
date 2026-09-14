import mongoose from "mongoose";
import { Transaction } from "../models/Transaction.js";
import { logger } from "../utils/logger.js";

// ─── Helper: get numeric values for a column ─────────────────────────────────
async function getColumnValues(datasetId, column, filters = {}) {
  const match = { dataset: new mongoose.Types.ObjectId(datasetId) };

  // Apply optional field filters (e.g., vendor = "Acme")
  for (const [field, value] of Object.entries(filters)) {
    match[field] = value;
  }

  const docs = await Transaction.find(match)
    .select({ rowNumber: 1, rawData: 1, [column]: 1, _id: 0 })
    .lean();

  return docs.map((d) => {
    let val = d[column];
    if (val === undefined || val === null) {
      // Fall back to rawData
      val = d.rawData?.[column];
    }
    const num = typeof val === "object" && val.$numberDecimal
      ? parseFloat(val.$numberDecimal)
      : parseFloat(val);
    return { rowNumber: d.rowNumber, value: isNaN(num) ? null : num };
  });
}

function median(sorted) {
  const n = sorted.length;
  if (n === 0) return null;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function std(values, mean) {
  if (values.length === 0) return 0;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

// ─── Tool: compute_aggregate ─────────────────────────────────────────────────
async function compute_aggregate({ datasetId, column, aggregation, filters = {} }) {
  logger.debug(`[tools] compute_aggregate col=${column} agg=${aggregation}`);
  const entries = await getColumnValues(datasetId, column, filters);
  const valid = entries.filter((e) => e.value !== null);

  if (valid.length === 0) {
    return { result: null, sourceRows: [] };
  }

  const nums = valid.map((e) => e.value);
  const rows = valid.map((e) => e.rowNumber);
  const sum = nums.reduce((a, b) => a + b, 0);
  const mean = sum / nums.length;
  const sorted = [...nums].sort((a, b) => a - b);

  let result;
  switch (aggregation) {
    case "sum":    result = sum; break;
    case "mean":   result = mean; break;
    case "median": result = median(sorted); break;
    case "std":    result = std(nums, mean); break;
    case "count":  result = nums.length; break;
    case "min":    result = sorted[0]; break;
    case "max":    result = sorted[sorted.length - 1]; break;
    default:
      throw new Error(`Unknown aggregation: ${aggregation}`);
  }

  return { result: parseFloat(result.toFixed(6)), sourceRows: rows };
}

// ─── Tool: find_anomalies ────────────────────────────────────────────────────
async function find_anomalies({ datasetId, valueColumn, groupBy, threshold = 3 }) {
  logger.debug(`[tools] find_anomalies col=${valueColumn} groupBy=${groupBy} threshold=${threshold}`);

  const match = { dataset: new mongoose.Types.ObjectId(datasetId) };
  const docs = await Transaction.find(match)
    .select({ rowNumber: 1, rawData: 1, [valueColumn]: 1, [groupBy]: 1, _id: 0 })
    .lean();

  // Group docs
  const groups = {};
  for (const d of docs) {
    let val = d[valueColumn] ?? d.rawData?.[valueColumn];
    let grp = d[groupBy] ?? d.rawData?.[groupBy] ?? "__all__";
    const num = parseFloat(val);
    if (isNaN(num)) continue;
    if (!groups[grp]) groups[grp] = [];
    groups[grp].push({ rowNumber: d.rowNumber, value: num });
  }

  const anomalies = [];
  for (const [group, items] of Object.entries(groups)) {
    if (items.length < 3) continue;  // not enough data for z-score
    const nums = items.map((i) => i.value);
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const sigma = std(nums, mean);
    if (sigma === 0) continue;

    for (const item of items) {
      const z = Math.abs((item.value - mean) / sigma);
      if (z >= threshold) {
        anomalies.push({ rowNumber: item.rowNumber, group, value: item.value, zScore: parseFloat(z.toFixed(3)) });
      }
    }
  }

  anomalies.sort((a, b) => b.zScore - a.zScore);
  return { result: anomalies, sourceRows: anomalies.map((a) => a.rowNumber) };
}

// ─── Tool: list_rows ─────────────────────────────────────────────────────────
async function list_rows({ datasetId, rowNumbers }) {
  logger.debug(`[tools] list_rows rows=${rowNumbers}`);
  const docs = await Transaction.find({
    dataset: new mongoose.Types.ObjectId(datasetId),
    rowNumber: { $in: rowNumbers },
  })
    .lean()
    .select({ _id: 0, __v: 0 });

  const rows = docs.map((d) => ({
    ...d,
    amount: d.amount?.$numberDecimal ? parseFloat(d.amount.$numberDecimal) : d.amount,
    rawData: d.rawData instanceof Map ? Object.fromEntries(d.rawData) : d.rawData,
  }));

  return { result: rows, sourceRows: rows.map((r) => r.rowNumber) };
}

// ─── Executors map ────────────────────────────────────────────────────────────
export const TOOL_EXECUTORS = {
  compute_aggregate,
  find_anomalies,
  list_rows,
};

// ─── OpenAI tool schemas ──────────────────────────────────────────────────────
export const FINANCIAL_TOOLS = [
  {
    name: "compute_aggregate",
    description:
      "Compute a statistical aggregate (sum, mean, median, std, count, min, max) over a numeric column in the dataset. Supports optional field filters. Returns the result and the source row numbers used.",
    parameters: {
      type: "object",
      required: ["datasetId", "column", "aggregation"],
      properties: {
        datasetId: { type: "string", description: "MongoDB ObjectId of the dataset" },
        column: { type: "string", description: "Column name to aggregate" },
        aggregation: {
          type: "string",
          enum: ["sum", "mean", "median", "std", "count", "min", "max"],
          description: "Aggregation function",
        },
        filters: {
          type: "object",
          description: "Optional key-value filters on document fields (e.g. {\"vendor\": \"Acme\"})",
          additionalProperties: true,
        },
      },
    },
  },
  {
    name: "find_anomalies",
    description:
      "Detect statistical anomalies in a numeric column using z-score analysis, optionally grouped by a categorical column. Returns rows where |z-score| >= threshold.",
    parameters: {
      type: "object",
      required: ["datasetId", "valueColumn"],
      properties: {
        datasetId: { type: "string", description: "MongoDB ObjectId of the dataset" },
        valueColumn: { type: "string", description: "Numeric column to analyze" },
        groupBy: { type: "string", description: "Optional grouping column for per-group z-score" },
        threshold: { type: "number", description: "Z-score threshold (default 3)" },
      },
    },
  },
  {
    name: "list_rows",
    description: "Retrieve the raw transaction rows by their row numbers for inspection and citation.",
    parameters: {
      type: "object",
      required: ["datasetId", "rowNumbers"],
      properties: {
        datasetId: { type: "string", description: "MongoDB ObjectId of the dataset" },
        rowNumbers: {
          type: "array",
          items: { type: "integer" },
          description: "Array of row numbers to retrieve",
        },
      },
    },
  },
];
