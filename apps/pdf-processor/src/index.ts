import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { processPdf } from "./routes/process-pdf.js";
import { DocumentUploadEvent } from "./types/document-upload-event.js";
import { processDocument } from "./routes/process-document.js";

// Create Hono application
const app = new Hono();

app.get("/document-processor/health", (c) => {
  try {
    const requiredEnvVars = ["GOOGLE_VERTEX_PROJECT"];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      return c.json({ error: "Missing required environment variables" }, 500);
    }

    return c.json(
      {
        message: "API is running",
        timestamp: new Date().toISOString(),
      },
      200
    );
  } catch (error) {
    return c.json({ error: "Health check failed" }, 500);
  }
});

app.post("/document-processor/process-pdf", async (c) => {
  try {
    const data = (await c.req.json()) as DocumentUploadEvent;

    if (!data.bucket || !data.name || !data.size) {
      return c.json(
        {
          error: "Missing required fields: bucket, name, and size are required",
        },
        400
      );
    }

    await processPdf(data);
    return c.json({ message: "PDF processed successfully" }, 200);
  } catch (error) {
    console.error("Error in PDF processing endpoint:", error);
    return c.json({ error: "Failed to process PDF" }, 500);
  }
});

app.post("/document-processor/process-document", async (c) => {
  try {
    const data = (await c.req.json()) as DocumentUploadEvent;

    if (!data.bucket || !data.name || !data.size) {
      return c.json(
        {
          error: "Missing required fields: bucket, name, and size are required",
        },
        400
      );
    }

    await processDocument(data);
    return c.json({ message: "Document processed successfully" }, 200);
  } catch (error) {
    console.error("Error in document processing endpoint:", error);
    return c.json({ error: "Failed to process document" }, 500);
  }
});

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

// Export the Hono app for testing purposes
export default app;
