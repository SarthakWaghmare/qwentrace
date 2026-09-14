// Must be first — validates env vars and loads .env
import "./src/config/env.js";

import { env } from "./src/config/env.js";
import { connectDB } from "./src/config/db.js";
import { logger } from "./src/utils/logger.js";
import app from "./src/app.js";

async function main() {
  await connectDB();

  const server = app.listen(env.port, () => {
    logger.info(`QwenTrace server running on port ${env.port} [${env.nodeEnv}]`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      const mongoose = await import("mongoose");
      await mongoose.default.disconnect();
      logger.info("MongoDB disconnected. Bye.");
      process.exit(0);
    });
    // Force exit after 10s
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.error(`Unhandled rejection: ${reason}`);
    shutdown("unhandledRejection");
  });
}

main();
