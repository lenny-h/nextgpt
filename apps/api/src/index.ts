import "@workspace/server/types/hono.js";

import { serve } from "@hono/node-server";
import { protectedApiRouter } from "@workspace/api-routes/routes/protected/index.js";
import { unprotectedApiRouter } from "@workspace/api-routes/routes/unprotected/index.js";
import { authMiddleware } from "@workspace/server/auth-middleware.js";
import { auth } from "@workspace/server/auth-server.js";
import { errorHandler } from "@workspace/server/error-handler.js";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";

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
app.use("/capi/protected/*", authMiddleware);

// Default root route
app.get("/", (c) => {
  return c.json({
    name: "NextGPT API",
    version: "1.0.0",
    status: "Running",
  });
});

// Authentication routes
app.on(["GET", "POST"], "/capi/auth/*", (c) => auth.handler(c.req.raw));

// Unprotected routes
app.route("/capi/public", unprotectedApiRouter);

// Protected routes
app.route("/capi/protected", protectedApiRouter);

const PORT = process.env.PORT || 8080;
serve(
  {
    fetch: app.fetch,
    port: Number(PORT),
  },
  (info) => {
    console.log(`Server running on http://localhost:${info.port}`);
  }
);

export default app;

export type ApiAppType = typeof app;
