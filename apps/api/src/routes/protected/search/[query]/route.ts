import {
  retrieveDocumentSources,
  retrieveEmbedding,
} from "@/src/utils/retrieve-context.js";
import { userHasPermissions } from "@/src/utils/user-has-permissions.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import * as z from "zod";
import { querySchema, searchPayloadSchema } from "./schema.js";

const paramSchema = z.object({ query: querySchema }).strict();

const app = new Hono().post(
  "/",
  validator("param", (value) => {
    return paramSchema.parse(value);
  }),
  validator("json", async (value, c) => {
    return searchPayloadSchema.parse(value);
  }),
  async (c) => {
    const { query } = c.req.valid("param");
    const { filter, fts } = c.req.valid("json");
    const user = c.get("user");

    const hasPermission = await userHasPermissions({
      userId: user.id,
      metadata: (user as any).app_metadata, // TODO: fix
      bucketId: filter.bucketId,
      courses: filter.courses,
      files: filter.files,
    });

    if (!hasPermission) {
      throw new HTTPException(403, { message: "FORBIDDEN" });
    }

    let embedding, ftsQuery;
    if (fts) {
      ftsQuery = query;
    } else {
      embedding = await retrieveEmbedding(query);
    }

    const sources = await retrieveDocumentSources({
      filter,
      retrieveContent: false,
      embedding,
      ftsQuery,
      pageNumbers: [],
    });

    return c.json({
      sources,
    });
  }
);

export default app;
