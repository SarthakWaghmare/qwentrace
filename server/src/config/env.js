import "dotenv/config";

const required = ["MONGO_URI", "JWT_SECRET", "QWEN_API_KEY"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters");
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  qwenApiKey: process.env.QWEN_API_KEY,
  qwenBaseUrl: process.env.QWEN_BASE_URL || "https://openrouter.ai/api/v1",
  qwenModel: process.env.QWEN_MODEL || "qwen/qwen3-coder",
};
