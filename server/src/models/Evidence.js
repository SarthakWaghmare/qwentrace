import mongoose from "mongoose";

const computationSchema = new mongoose.Schema(
  {
    label: { type: String },
    formula: { type: String },
    value: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const evidenceSchema = new mongoose.Schema(
  {
    query: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Query",
      required: true,
    },
    dataset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dataset",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    conclusion: { type: String },
    sourceRows: [{ type: Number }],
    computations: [computationSchema],
    confidence: { type: Number, min: 0, max: 1 },
    // Snapshot of the transactions cited at answer time
    citedTransactions: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

evidenceSchema.index({ query: 1 }, { unique: true });
evidenceSchema.index({ user: 1, createdAt: -1 });

export const Evidence = mongoose.model("Evidence", evidenceSchema);
