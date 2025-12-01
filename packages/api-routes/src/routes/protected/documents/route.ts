import * as z from "zod";

import { insertDocument } from "@workspace/api-routes/lib/db/queries/documents.js";
import { itemsPerPageSchema } from "@workspace/api-routes/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@workspace/api-routes/schemas/page-number-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { documents } from "@workspace/server/drizzle/schema.js";
import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { insertDocumentSchema } from "./schema.js";

const querySchema = z
  .object({
    pageNumber: pageNumberSchema,
    itemsPerPage: itemsPerPageSchema,
  })
  .strict();

const app = new Hono()
  .get(
    "/",
    validator("query", (value, c) => {
      const parsed = querySchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
    }),
    async (c) => {
      const { pageNumber, itemsPerPage } = c.req.valid("query");
      const user = c.get("user");

      const result = await db
        .select({
          id: documents.id,
          title: documents.title,
          content: sql<string>`SUBSTRING(${documents.content}, 1, 50)`.as(
            "content"
          ),
          kind: documents.kind,
          createdAt: documents.createdAt,
        })
        .from(documents)
        .where(eq(documents.userId, user.id))
        .limit(itemsPerPage)
        .offset(pageNumber * itemsPerPage);

      return c.json(result);
    }
  )
  .post(
    "/",
    validator("json", async (value, c) => {
      const parsed = insertDocumentSchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
    }),
    async (c) => {
      const { title, content, kind } = c.req.valid("json");
      const user = c.get("user");

      await insertDocument({
        userId: user.id,
        title,
        content,
        kind,
      });

      return c.json({ message: "Document inserted" });
    }
  );

export default app;
