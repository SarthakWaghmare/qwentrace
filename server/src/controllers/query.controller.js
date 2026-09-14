import { Dataset } from "../models/Dataset.js";
import { Query } from "../models/Query.js";
import { Evidence } from "../models/Evidence.js";
import { chatWithTools } from "../services/qwen.service.js";
import { FINANCIAL_TOOLS, TOOL_EXECUTORS } from "../services/tools.service.js";
import { createEvidence } from "../services/evidence.service.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

const MAX_ROUNDS = 5;

// POST /api/queries
export const askQuestion = asyncHandler(async (req, res) => {
  const { datasetId, question } = req.body;

  if (!datasetId || !question?.trim()) {
    throw ApiError.badRequest("datasetId and question are required");
  }

  // Validate dataset belongs to user and is indexed
  const dataset = await Dataset.findOne({ _id: datasetId, user: req.user._id });
  if (!dataset) throw ApiError.notFound("Dataset");
  if (dataset.status !== "indexed") {
    throw ApiError.badRequest(`Dataset is not ready (status: ${dataset.status})`);
  }

  // Create pending query record
  const query = await Query.create({
    user: req.user._id,
    dataset: datasetId,
    question: question.trim(),
    status: "processing",
    modelUsed: env.qwenModel,
  });

  const startMs = Date.now();

  try {
    // Inject dataset context into tools (bind datasetId)
    const boundTools = FINANCIAL_TOOLS;

    // Initial user message includes dataset metadata
    const datasetContext = `Dataset: "${dataset.name}" (${dataset.rowCount} rows, columns: ${dataset.columnNames?.join(", ")}). Dataset ID: ${datasetId}.`;

    const messages = [
      {
        role: "user",
        content: `${datasetContext}\n\nQuestion: ${question.trim()}`,
      },
    ];

    const recordedToolCalls = [];
    let finalAnswerJson = null;
    let rounds = 0;

    // ── Agentic loop ──────────────────────────────────────────────────────────
    while (rounds < MAX_ROUNDS) {
      rounds++;
      logger.info(`[query] Round ${rounds}/${MAX_ROUNDS} for query=${query._id}`);

      const completion = await chatWithTools({ messages, tools: boundTools });
      const choice = completion.choices[0];
      const assistantMsg = choice.message;

      // Always push assistant message into context
      messages.push(assistantMsg);

      // ── No more tool calls → final answer ────────────────────────────────
      if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
        const raw = assistantMsg.content || "{}";
        try {
          finalAnswerJson = JSON.parse(raw);
        } catch {
          finalAnswerJson = { conclusion: raw, sourceRows: [], computations: [], confidence: 0.3 };
        }
        break;
      }

      // ── Execute each tool call ────────────────────────────────────────────
      for (const tc of assistantMsg.tool_calls) {
        const { id, function: fn } = tc;
        const toolName = fn.name;
        const executor = TOOL_EXECUTORS[toolName];

        let toolResult;
        if (!executor) {
          toolResult = { error: `Unknown tool: ${toolName}`, sourceRows: [] };
        } else {
          try {
            const args = JSON.parse(fn.arguments);
            // Always inject the datasetId from our validated context
            args.datasetId = datasetId;
            toolResult = await executor(args);
          } catch (err) {
            logger.warn(`[query] Tool ${toolName} failed: ${err.message}`);
            toolResult = { error: err.message, sourceRows: [] };
          }
        }

        recordedToolCalls.push({
          toolName,
          arguments: JSON.parse(fn.arguments),
          result: toolResult.result ?? toolResult,
          sourceRows: toolResult.sourceRows || [],
        });

        // Push tool result back into message history
        messages.push({
          role: "tool",
          tool_call_id: id,
          content: JSON.stringify(toolResult),
        });
      }
    }

    // ── If loop exhausted without final answer ───────────────────────────────
    if (!finalAnswerJson) {
      finalAnswerJson = {
        conclusion: "Analysis incomplete: maximum reasoning rounds reached.",
        sourceRows: [],
        computations: [],
        confidence: 0.1,
      };
    }

    const latencyMs = Date.now() - startMs;

    // Create evidence trail
    const evidence = await createEvidence({
      queryId: query._id,
      datasetId,
      userId: req.user._id,
      answerJson: finalAnswerJson,
    });

    // Update query to completed
    await Query.findByIdAndUpdate(query._id, {
      status: "completed",
      answer: finalAnswerJson.conclusion,
      answerJson: finalAnswerJson,
      toolCalls: recordedToolCalls,
      totalLatencyMs: latencyMs,
      rounds,
    });

    logger.info(`[query] Completed query=${query._id} in ${latencyMs}ms (${rounds} rounds)`);

    res.json({
      success: true,
      queryId: query._id,
      answer: finalAnswerJson.conclusion,
      sourceRows: finalAnswerJson.sourceRows,
      computations: finalAnswerJson.computations,
      confidence: finalAnswerJson.confidence,
      evidenceId: evidence._id,
      latencyMs,
      rounds,
      toolCalls: recordedToolCalls,
    });
  } catch (err) {
    const latencyMs = Date.now() - startMs;
    logger.error(`[query] Failed query=${query._id}: ${err.message}`);

    await Query.findByIdAndUpdate(query._id, {
      status: "failed",
      errorMessage: err.message,
      totalLatencyMs: latencyMs,
    });

    throw err;
  }
});

// GET /api/queries
export const listQueries = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const filter = { user: req.user._id };
  if (req.query.datasetId) filter.dataset = req.query.datasetId;

  const [queries, total] = await Promise.all([
    Query.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Query.countDocuments(filter),
  ]);

  res.json({ success: true, queries, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/queries/:id
export const getQuery = asyncHandler(async (req, res) => {
  const query = await Query.findOne({ _id: req.params.id, user: req.user._id });
  if (!query) throw ApiError.notFound("Query");

  const evidence = await Evidence.findOne({ query: query._id });
  res.json({ success: true, query, evidence });
});
