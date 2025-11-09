import { createBucket } from "@workspace/api-routes/lib/db/queries/buckets.js";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { createBucketPayloadSchema } from "./schema.js";

const app = new Hono().post(
  "/",
  validator("json", async (value, c) => {
    const parsed = createBucketPayloadSchema.safeParse(value);
    if (!parsed.success) {
      return c.text("BAD_REQUEST", 400);
    }
    return parsed.data;
  }),
  async (c) => {
    const { values, type } = c.req.valid("json");
    const user = c.get("user");

    await createBucket({
      userId: user.id,
      name: values.bucketName,
      type,
    });

    return c.json({ message: "Bucket created" });
  }
);

export default app;
