import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    dataset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dataset",
      required: true,
    },
    rowNumber: {
      type: Number,
      required: true,
    },
    // Normalized canonical fields
    transactionId: { type: String, trim: true },
    date: { type: Date },
    vendor: { type: String, trim: true },
    // Decimal128 for financial precision
    amount: { type: mongoose.Schema.Types.Decimal128 },
    invoiceId: { type: String, trim: true },
    category: { type: String, trim: true },
    // All original raw fields stored here
    rawData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Unique: one row per dataset
transactionSchema.index({ dataset: 1, rowNumber: 1 }, { unique: true });
// Vendor + date lookups
transactionSchema.index({ dataset: 1, vendor: 1, date: 1 });

// Convert Decimal128 amount to float in JSON output
transactionSchema.set("toJSON", {
  transform(doc, ret) {
    if (ret.amount && ret.amount.constructor?.name === "Decimal128") {
      ret.amount = parseFloat(ret.amount.toString());
    }
    if (ret.rawData instanceof Map) {
      ret.rawData = Object.fromEntries(ret.rawData);
    }
    return ret;
  },
});

export const Transaction = mongoose.model("Transaction", transactionSchema);
