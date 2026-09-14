import mongoose from "mongoose";

const toolCallSchema = new mongoose.Schema(
  {
    toolName: String,
    arguments: mongoose.Schema.Types.Mixed,
    result: mongoose.Schema.Types.Mixed,
    sourceRows: [Number],
    executedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const querySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dataset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dataset",
      required: true,
    },
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
      maxlength: [2000, "Question too long"],
    },
    answer: { type: String },
    // Structured JSON from Qwen
    answerJson: { type: mongoose.Schema.Types.Mixed },
    toolCalls: [toolCallSchema],
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    errorMessage: { type: String },
    totalLatencyMs: { type: Number },
    modelUsed: { type: String },
    rounds: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

querySchema.index({ user: 1, createdAt: -1 });
querySchema.index({ dataset: 1, createdAt: -1 });

export const Query = mongoose.model("Query", querySchema);
