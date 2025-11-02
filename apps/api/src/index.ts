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
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { internalApiRouter } from "@workspace/api-routes/routes/internal/index.js";

// Create Hono application
const app = new Hono();

// Global middleware
app.use("*", requestId());
if (process.env.NODE_ENV === "development") {
  app.use("*", logger());
}
app.use("*", compress());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: process.env.ALLOWED_ORIGINS!.split(","),
    credentials: true,
  })
);

// Global error handler
app.use("*", errorHandler);

// Default root route
app.get("/", (c) => {
  return c.json({
    name: "NextGPT API",
    version: "1.0.0",
    status: "Running",
  });
});

// Authentication routes
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// Authentication middleware for protected routes
app.use("/api/protected/*", authMiddleware);

// Internal secret middleware for internal routes
app.use("/api/internal/*", internalAuthMiddleware);

// Internal routes
app.route("/api/internal", internalApiRouter);

// Unprotected routes
app.route("/api/public", unprotectedApiRouter);

// Protected routes
app.route("/api/protected", protectedApiRouter);

const PORT = process.env.PORT || 8080;
serve(
  {
    fetch: app.fetch,
    port: Number(PORT),
    serverOptions: {
      requestTimeout: 30000, // 30 seconds timeout
    },
  },
  (info) => {
    console.log(`Server running on http://localhost:${info.port}`);
  }
);

export default app;

export type ApiAppType = typeof app;
