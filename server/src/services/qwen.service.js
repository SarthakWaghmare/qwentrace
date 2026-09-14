import OpenAI from "openai";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const client = new OpenAI({
  apiKey: env.qwenApiKey,
  baseURL: env.qwenBaseUrl,
  defaultHeaders: {
    "HTTP-Referer": env.clientUrl,
    "X-Title": "QwenTrace",
  },
});

const SYSTEM_PROMPT = `You are QwenTrace, an auditable financial analysis agent.
RULES:
- You NEVER state a number without citing the exact source row numbers from the dataset.
- You MUST call the provided tools to perform ALL arithmetic and data lookups — never compute in your head.
- After gathering all necessary data via tools, respond with ONLY a JSON object in this exact shape:
{
  "conclusion": "<plain-language answer to the user question>",
  "sourceRows": [<list of integer row numbers that support the answer>],
  "computations": [
    { "label": "<what was computed>", "formula": "<expression>", "value": <numeric result> }
  ],
  "confidence": <0.0 to 1.0, your confidence in the answer>
}
- If you cannot answer with full traceability, set confidence below 0.5 and explain in conclusion.`;

/**
 * One round of chat with Qwen, supplying tools.
 * @param {{ messages: object[], tools: object[] }} param0
 * @returns {Promise<import("openai").ChatCompletion>}
 */
export async function chatWithTools({ messages, tools }) {
  logger.debug(`[qwen] Sending ${messages.length} messages, ${tools.length} tools`);

  const completion = await client.chat.completions.create({
    model: env.qwenModel,
    temperature: 0.1,
    max_tokens: 2048,
    tools: tools.map((t) => ({ type: "function", function: t })),
    tool_choice: "auto",
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
  });

  logger.debug(`[qwen] finish_reason=${completion.choices[0].finish_reason}`);
  return completion;
}
