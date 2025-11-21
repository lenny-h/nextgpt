import "@workspace/server/types/hono.js";

import { serve } from "@hono/node-server";
import { createLogger } from "@workspace/server/logger.js";
import app from "./app.js";

// Configure logger
const logger = createLogger("api-server");

const PORT = process.env.PORT || 8080;
const isDev = process.env.NODE_ENV === "development";

logger.info(
  `Starting NextGPT API server on port ${PORT} (Environment: ${isDev ? "development" : "production"})`
);

serve(
  {
    fetch: app.fetch,
    port: Number(PORT),
    serverOptions: {
      requestTimeout: 30000, // 30 seconds timeout
    },
  },
  (info) => {
    logger.info(`Server running on http://localhost:${info.port}`);
  }
);
