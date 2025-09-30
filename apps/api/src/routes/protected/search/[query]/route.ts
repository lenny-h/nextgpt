import {
  retrieveDocumentSources,
  retrieveEmbedding,
} from "@/src/utils/retrieve-context.js";
import { userHasPermissions } from "@/src/utils/user-has-permissions.js";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { querySchema, searchPayloadSchema } from "./schema.js";

export async function POST(c: Context) {
  const query = querySchema.parse(c.req.param("query"));

  const user = c.get("user");

  const payload = await c.req.json();

  const { filter, fts } = searchPayloadSchema.parse(payload);

  const hasPermission = await userHasPermissions({
    userId: user.id,
    metadata: user.app_metadata,
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
