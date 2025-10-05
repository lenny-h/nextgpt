import * as z from "zod";

import { filterNonExistingBucketUsers } from "@workspace/api-routes/lib/db/queries/bucket-users.js";
import { getBucketOwner } from "@workspace/api-routes/lib/db/queries/buckets.js";
import { addUserInvitationsBatch } from "@workspace/api-routes/lib/db/queries/invitations.js";
import { getUserIdsByUsernames } from "@workspace/api-routes/lib/db/queries/users.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { chunk } from "@workspace/api-routes/utils/utils.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { default as papa } from "papaparse";

const BATCH_SIZE = 100;
const MAX_FILE_SIZE = 32 * 1024; // 32KB
const paramSchema = z.object({ bucketId: uuidSchema }).strict();
const formSchema = z
  .object({
    file: z
      .instanceof(File)
      .refine((f) => f.size <= MAX_FILE_SIZE, { message: "FILE_TOO_LARGE" }),
  })
  .strict();

const app = new Hono().post(
  "/",
  validator("param", (value) => {
    return paramSchema.parse(value);
  }),
  validator("form", (value) => {
    return formSchema.parse(value);
  }),
  async (c) => {
    const { bucketId } = c.req.valid("param");

    const user = c.get("user");

    const { owner, name: bucketName } = await getBucketOwner({
      bucketId,
    });

    if (owner !== user.id) {
      throw new HTTPException(403, { message: "FORBIDDEN" });
    }

    const body = c.req.valid("form");
    const file = body.file;

    if (!file || !(file instanceof File)) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }

    const fileText = await file.text();

    const result = papa.parse<string[]>(fileText, {
      header: false, // Assuming no header row
      skipEmptyLines: true,
    });

    if (result.errors.length > 0) {
      throw new HTTPException(400, { message: "INVALID_CSV_FILE" });
    }

    const usernames = result.data.map((row) => row[0]).filter(Boolean);
    const uniqueUsernames = Array.from(new Set(usernames));

    if (uniqueUsernames.length > 600) {
      throw new HTTPException(400, {
        message: "TOO_MANY_USERS",
      });
    }

    const usernameBatches = chunk(uniqueUsernames, BATCH_SIZE);
    const foundUserIds: string[] = [];

    for (const batch of usernameBatches) {
      const users = await getUserIdsByUsernames(batch);

      if (users.length !== batch.length) {
        const notFoundUsernames = batch.filter(
          (username) => !users.some((user) => user.username === username)
        );

        throw new HTTPException(404, {
          message: `User(s) not found: ${notFoundUsernames.join(", ")}`,
        });
      }
      foundUserIds.push(...users.map((user) => user.id));
    }

    const userBatches = chunk(foundUserIds, BATCH_SIZE);

    for (const batch of userBatches) {
      const newUserIds = await filterNonExistingBucketUsers({
        bucketId,
        userIds: batch,
      });
      await addUserInvitationsBatch({
        originUserId: user.id,
        invitations: newUserIds,
        bucketId,
        bucketName,
      });
    }

    return c.json({
      nameCount: foundUserIds.length,
    });
  }
);

export default app;
