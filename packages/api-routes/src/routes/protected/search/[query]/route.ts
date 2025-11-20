import * as z from "zod";

import {
  retrieveEmbedding,
  searchDocuments,
} from "@workspace/api-routes/utils/retrieve-context.js";
import { userHasPermissions } from "@workspace/api-routes/utils/user-has-permissions.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { querySchema, searchPayloadSchema } from "./schema.js";

const paramSchema = z.object({ query: querySchema }).strict();

const app = new Hono().post(
  "/",
  validator("param", (value, c) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      return c.text("BAD_REQUEST", 400);
    }
    return parsed.data;
  }),
  validator("json", async (value, c) => {
    const parsed = await searchPayloadSchema.safeParseAsync(value);
    if (!parsed.success) {
      return c.text("BAD_REQUEST", 400);
    }
    return parsed.data;
  }),
  async (c) => {
    const { query } = c.req.valid("param");
    const { filter, fts } = c.req.valid("json");
    const user = c.get("user");

    const hasPermission = await userHasPermissions({
      userId: user.id,
      filterBucketId: filter.bucket.id,
      filterCourseIds: filter.courses.map((c) => c.id),
      filterFileIds: filter.files.map((f) => f.id),
      filterAttachments: [],
      filterDocumentIds: [],
      filterPromptIds: [],
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

    const sources = await searchDocuments({
      filter,
      retrieveContent: false,
      embedding,
      ftsQuery,
      pageNumbers: [],
    });

    return c.json(sources);
  }
);

export default app;
