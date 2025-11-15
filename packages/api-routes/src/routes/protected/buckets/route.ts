import { createBucket } from "@workspace/api-routes/lib/db/queries/buckets.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
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

    if (
      process.env.ONLY_ALLOW_ADMIN_TO_CREATE_BUCKETS === "true" &&
      !process.env.ADMIN_USER_IDS?.split(",").includes(user.id)
    ) {
      throw new HTTPException(403, { message: "FORBIDDEN" });
    }

    await createBucket({
      userId: user.id,
      name: values.bucketName,
      type,
      public: values.public,
    });

    return c.json({ message: "Bucket created" });
  }
);

export default app;
