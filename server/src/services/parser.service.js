import { parse } from "csv-parse";
import XLSX from "xlsx";
import { logger } from "../utils/logger.js";

// ─── Header aliases ───────────────────────────────────────────────────────────
const ALIASES = {
  transactionId: ["transactionid", "txnid", "txn_id", "id", "transaction_id"],
  date: ["date", "transactiondate", "transaction_date", "txn_date"],
  vendor: ["vendor", "payee", "merchant", "supplier"],
  amount: ["amount", "value", "total", "sum", "price"],
  invoiceId: ["invoiceid", "inv", "invoice_id", "invoice_no", "invoice_number"],
  category: ["category", "type", "expense_type", "expense_category"],
};

/**
 * Map raw header to canonical field name (case-insensitive alias lookup).
 * Returns null if no alias matches.
 */
function resolveCanonical(header) {
  const normalized = header.toLowerCase().replace(/[\s_-]+/g, "");
  for (const [canonical, aliases] of Object.entries(ALIASES)) {
    if (aliases.includes(normalized)) return canonical;
  }
  return null;
}

// ─── Type detection ───────────────────────────────────────────────────────────
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/;
const US_DATE = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
const CURRENCY = /^-?[\$\£\€]?\s?\d{1,3}(,\d{3})*(\.\d+)?$/;
const NUMBER = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;

function detectType(samples) {
  const nonempty = samples.filter((v) => v !== null && v !== "" && v !== undefined);
  if (nonempty.length === 0) return "string";

  const checks = {
    boolean: (v) => /^(true|false|yes|no|1|0)$/i.test(String(v)),
    date: (v) => ISO_DATE.test(String(v)) || US_DATE.test(String(v)),
    currency: (v) => CURRENCY.test(String(v).trim()),
    number: (v) => NUMBER.test(String(v).trim()),
  };

  for (const [type, fn] of Object.entries(checks)) {
    if (nonempty.slice(0, 20).every(fn)) return type;
  }
  return "string";
}

function coerceValue(raw, type) {
  if (raw === null || raw === "" || raw === undefined) return null;
  const s = String(raw).trim();
  switch (type) {
    case "boolean":
      return /^(true|yes|1)$/i.test(s);
    case "date": {
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }
    case "currency":
    case "number":
      return parseFloat(s.replace(/[^\d.\-eE]/g, "")) || null;
    default:
      return s;
  }
}

/**
 * Normalize a raw row object into canonical + rawData fields.
 */
export function normalizeRow(rawRow, headerTypes) {
  const canonical = {};
  const rawData = {};

  for (const [header, rawVal] of Object.entries(rawRow)) {
    const type = headerTypes[header] || "string";
    const coerced = coerceValue(rawVal, type);
    rawData[header] = coerced;

    const field = resolveCanonical(header);
    if (field && !(field in canonical)) {
      canonical[field] = coerced;
    }
  }

  return { canonical, rawData };
}

// ─── CSV parser ───────────────────────────────────────────────────────────────
export function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const records = [];
    const parser = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
    });

    parser.on("readable", () => {
      let row;
      while ((row = parser.read()) !== null) {
        records.push(row);
      }
    });
    parser.on("error", reject);
    parser.on("end", () => resolve(records));
  });
}

// ─── XLSX parser ─────────────────────────────────────────────────────────────
export function parseXLSX(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const records = XLSX.utils.sheet_to_json(sheet, {
    defval: null,
    raw: false,
    dateNF: "YYYY-MM-DD",
  });
  return records;
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────
/**
 * Parse a file buffer, auto-detect types, normalise rows.
 * @param {Buffer} buffer
 * @param {"csv"|"xlsx"} fileType
 * @returns {{ rows: object[], columnNames: string[], detectedTypes: Record<string,string> }}
 */
export async function parseFile(buffer, fileType) {
  logger.info(`[parser] Parsing ${fileType} file (${buffer.length} bytes)`);

  let rawRows;
  if (fileType === "csv") {
    rawRows = await parseCSV(buffer);
  } else if (fileType === "xlsx") {
    rawRows = parseXLSX(buffer);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }

  if (rawRows.length === 0) {
    throw new Error("File contains no data rows");
  }

  const columnNames = Object.keys(rawRows[0]);

  // Detect column types from first 50 sample rows
  const sampleSize = Math.min(rawRows.length, 50);
  const detectedTypes = {};
  for (const col of columnNames) {
    const samples = rawRows.slice(0, sampleSize).map((r) => r[col]);
    detectedTypes[col] = detectType(samples);
  }

  logger.info(`[parser] ${rawRows.length} rows, ${columnNames.length} columns detected`);
  logger.debug(`[parser] Types: ${JSON.stringify(detectedTypes)}`);

  const rows = rawRows.map((rawRow, idx) => {
    const { canonical, rawData } = normalizeRow(rawRow, detectedTypes);
    return { rowNumber: idx + 1, ...canonical, rawData };
  });

  return { rows, columnNames, detectedTypes };
}
