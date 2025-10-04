import { filterNonExistingBucketUsers } from "@/src/lib/db/queries/bucket-users.js";
import { getBucketOwner } from "@/src/lib/db/queries/buckets.js";
import { addUserInvitationsBatch } from "@/src/lib/db/queries/invitations.js";
import { getUserIdsByUsernames } from "@/src/lib/db/queries/users.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { chunk } from "@/src/utils/utils.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import * as z from "zod";
import { default as papa } from "papaparse";

const BATCH_SIZE = 100;
const paramSchema = z.object({ bucketId: uuidSchema }).strict();

const app = new Hono().post(
  "/",
  validator("param", (value) => {
    return paramSchema.parse(value);
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

    const formData = await c.req.formData();
    const file = formData.get("file");

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
