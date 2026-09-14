import mongoose from "mongoose";

const datasetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Dataset name is required"],
      trim: true,
      maxlength: [200, "Name too long"],
    },
    originalFilename: { type: String, required: true },
    fileType: { type: String, enum: ["csv", "xlsx"], required: true },
    fileSizeBytes: { type: Number },
    rowCount: { type: Number, default: 0 },
    columnNames: [{ type: String }],
    detectedTypes: {
      type: Map,
      of: String,  // column -> detected type
    },
    status: {
      type: String,
      enum: ["uploading", "parsing", "indexed", "failed"],
      default: "uploading",
    },
    errorMessage: { type: String },
    description: { type: String, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

datasetSchema.index({ user: 1, createdAt: -1 });

export const Dataset = mongoose.model("Dataset", datasetSchema);
