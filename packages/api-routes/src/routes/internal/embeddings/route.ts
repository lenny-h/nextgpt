import { getEmbeddingModel } from "@workspace/api-routes/lib/embeddings-providers.js";
import { embed, embedMany } from "ai";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { batchEmbeddingSchema, singleEmbeddingSchema } from "./schema.js";

const app = new Hono()
  // Single embedding endpoint
  .post(
    "/single",
    validator("json", async (value, c) => {
      const parsed = singleEmbeddingSchema.safeParse(value);
      if (!parsed.success) {
        return c.text("BAD_REQUEST", 400);
      }
      return parsed.data;
    }),
    async (c) => {
      const { text } = c.req.valid("json");

      const { model } = await getEmbeddingModel();

      const { embedding } = await embed({
        model,
        value: text,
      });

      if (!embedding) {
        throw new HTTPException(500, {
          message: "Failed to generate embedding",
        });
      }

      return c.json({
        embedding,
      });
    }
  )
  // Batch embeddings endpoint
  .post(
    "/batch",
    validator("json", async (value, c) => {
      const parsed = batchEmbeddingSchema.safeParse(value);
      if (!parsed.success) {
        return c.text("BAD_REQUEST", 400);
      }
      return parsed.data;
    }),
    async (c) => {
      const { texts } = c.req.valid("json");

      const { model, providerOptions } = await getEmbeddingModel();

      const { embeddings } = await embedMany({
        model,
        providerOptions,
        values: texts,
      });

      if (!embeddings || embeddings.length === 0) {
        throw new HTTPException(500, {
          message: "Failed to generate embeddings",
        });
      }

      return c.json({
        embeddings,
      });
    }
  );

export default app;
