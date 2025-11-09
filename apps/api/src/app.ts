import { internalApiRouter } from "@workspace/api-routes/routes/internal/index.js";
import { protectedApiRouter } from "@workspace/api-routes/routes/protected/index.js";
import { unprotectedApiRouter } from "@workspace/api-routes/routes/unprotected/index.js";
import { authMiddleware } from "@workspace/server/auth-middleware.js";
import { auth } from "@workspace/server/auth-server.js";
import { errorHandler } from "@workspace/server/error-handler.js";
import { internalAuthMiddleware } from "@workspace/server/internal-auth-middleware.js";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";

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

export default app;

export type ApiAppType = typeof app;