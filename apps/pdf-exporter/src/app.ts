import { authMiddleware } from "@workspace/server/auth-middleware";
import { conditionalLogger } from "@workspace/server/conditional-logger.js";
import { errorHandler } from "@workspace/server/error-handler";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { protectedApiRouter } from "./routes/protected/index.js";
import { unprotectedApiRouter } from "./routes/unprotected/index.js";

// Create Hono application
const app = new Hono()
  .use("*", requestId())
  .use("*", compress())
  .use("*", secureHeaders())

  .use("*", conditionalLogger)

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

  // Authentication middleware for protected routes
  .use("/pdf-exporter/protected/*", authMiddleware)

  // Default root route
  .get("/", (c) => {
    return c.json({
      name: "NextGPT API",
      version: "1.0.0",
      status: "Running",
    });
  })

  // Unprotected routes
  .route("/pdf-exporter/public", unprotectedApiRouter)

  // Protected routes
  .route("/pdf-exporter/protected", protectedApiRouter);

export default app;
