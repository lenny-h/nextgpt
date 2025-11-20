import "@workspace/server/types/hono.js";

import { serve } from "@hono/node-server";
import { authMiddleware } from "@workspace/server/auth-middleware";
import { errorHandler } from "@workspace/server/error-handler";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { protectedApiRouter } from "./routes/protected/index.js";
import { unprotectedApiRouter } from "./routes/unprotected/index.js";

// Create Hono application
const app = new Hono();

// Global middleware
app.use("*", requestId());
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

// Authentication middleware for protected routes
app.use("/pdf-exporter/protected/*", authMiddleware);

// Default root route
app.get("/", (c) => {
  return c.json({
    name: "NextGPT API",
    version: "1.0.0",
    status: "Running",
  });
});

// Unprotected routes
app.route("/pdf-exporter/public", unprotectedApiRouter);

// Protected routes
app.route("/pdf-exporter/protected", protectedApiRouter);

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
