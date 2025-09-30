import { createBucket } from "@/src/lib/db/queries/buckets.js";
import { type Context } from "hono";
import { createBucketPayloadSchema } from "./schema.js";

export async function POST(c: Context) {
  const user = c.get("user");

  const payload = await c.req.json();

  const { values, type } = createBucketPayloadSchema.parse(payload);

  await createBucket({
    userId: user.id,
    name: values.bucketName,
    type,
  });

  return c.json("Bucket created");
}
