import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  retrieveDocumentSources,
  retrieveEmbedding,
} from "../../../../utils/retrieve-context.js";
import { userHasPermissions } from "../../../../utils/user-has-permissions.js";
import { querySchema, searchPayloadSchema } from "./schema.js";

// IMPORTANT TODO(DONE): Check if the user is authorized to access the files

export async function POST(c: Context) {
  const query = c.req.param("query");
  const payload = await c.req.json();

  const user = c.get("user");

  const validatedQuery = querySchema.parse(query);
  const { filter, fts } = searchPayloadSchema.parse(payload);

  const hasPermission = await userHasPermissions({
    userId: user.id,
    metadata: user.app_metadata,
    bucketId: filter.bucketId,
    courses: filter.courses,
    files: filter.files,
  });

  if (!hasPermission) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  let embedding, ftsQuery;
  if (fts) {
    ftsQuery = validatedQuery;
  } else {
    embedding = await retrieveEmbedding(validatedQuery);
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
