import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { errorHandler } from "./utils/error-handler.js";
import { authMiddleware } from "./middleware/auth.js";
import { protectedApiRouter } from "./routes/protected/index.js";
import { unprotectedApiRouter } from "./routes/unprotected/index.js";
import { cors } from "hono/cors";

// Create Hono application
const app = new Hono();

// Global middleware
app.use("*", requestId());
app.use("*", compress());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

app.use("*", errorHandler);

// Default root route
app.get("/", (c) => {
  return c.json({
    name: "NextGPT API",
    version: "1.0.0",
    status: "Running",
  });
});

// Unprotected API routes
app.route("/pdf-exporter/public", unprotectedApiRouter);

// Authentication middleware
app.use("/pdf-exporter/protected/*", authMiddleware);

// Protected API routes
app.route("/pdf-exporter/protected", protectedApiRouter);

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
