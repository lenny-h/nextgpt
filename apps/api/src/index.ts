import "@workspace/server/types/hono.js";

import { serve } from "@hono/node-server";
import { protectedApiRouter } from "@workspace/api-routes/routes/protected/index.js";
import { unprotectedApiRouter } from "@workspace/api-routes/routes/unprotected/index.js";
import { authMiddleware } from "@workspace/server/auth-middleware.js";
import { internalAuthMiddleware } from "@workspace/server/internal-auth-middleware.js";
import { auth } from "@workspace/server/auth-server.js";
import { errorHandler } from "@workspace/server/error-handler.js";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { internalApiRouter } from "@workspace/api-routes/routes/internal/index.js";
import { createLogger } from "@workspace/api-routes/utils/logger.js";

// Configure logger
const logger = createLogger("api-server");

// Create Hono application
const app = new Hono()
  .use("*", requestId())
  .use("*", compress())
  .use("*", secureHeaders())

  // CORS middleware
  .use(
    "*",
    cors({
      origin: process.env.ALLOWED_ORIGINS!.split(","),
      credentials: true,
    })
  )

  // Global error handler
  .use("*", errorHandler)

  // Default root route
  .get("/", (c) => {
    return c.json({
      name: "NextGPT API",
      version: "1.0.0",
      status: "Running",
    });
  })

  // Authentication routes
  .on(["POST", "GET"], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
  })

  // Authentication middleware for protected routes
  .use("/api/protected/*", authMiddleware)

  // Internal secret middleware for internal routes
  .use("/api/internal/*", internalAuthMiddleware)

  // Internal routes
  .route("/api/internal", internalApiRouter)

  // Unprotected routes
  .route("/api/public", unprotectedApiRouter)

  // Protected routes
  .route("/api/protected", protectedApiRouter);

// Apply conditional logger only in development
if (process.env.NODE_ENV === "development") {
  app.use("*", honoLogger());
}

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

export default app;

export type ApiAppType = typeof app;
