import {
  filterNonExistingBucketMaintainers,
  removeBucketMaintainersBatch,
} from "@/src/lib/db/queries/bucket-maintainers.js";
import { getBucketOwner, isBucketOwner } from "@/src/lib/db/queries/buckets.js";
import { addBucketMaintainerInvitationsBatch } from "@/src/lib/db/queries/invitations.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import * as z from "zod";
import { bucketMaintainersSchema } from "./schema.js";
import {
  bucketMaintainers,
  user as profile,
} from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";

const paramSchema = z.object({ bucketId: uuidSchema }).strict();

const app = new Hono()
  .get(
    "/",
    validator("param", (value) => {
      return paramSchema.parse(value);
    }),
    async (c) => {
      const { bucketId } = c.req.valid("param");
      const user = c.get("user");

      const hasPermissions = await isBucketOwner({
        userId: user.id,
        bucketId,
      });

      if (!hasPermissions) {
        throw new HTTPException(403, { message: "FORBIDDEN" });
      }

      const maintainers = await db
        .select({
          id: bucketMaintainers.userId,
          username: profile.username,
        })
        .from(bucketMaintainers)
        .innerJoin(profile, eq(bucketMaintainers.userId, profile.id))
        .where(eq(bucketMaintainers.bucketId, bucketId));

      return c.json({ maintainers });
    }
  )
  .post(
    "/",
    validator("param", (value) => {
      return paramSchema.parse(value);
    }),
    validator("json", async (value, c) => {
      return bucketMaintainersSchema.parse(value);
    }),
    async (c) => {
      const { bucketId } = c.req.valid("param");
      const { userIds } = c.req.valid("json");
      const user = c.get("user");

      const { owner, name: bucketName } = await getBucketOwner({
        bucketId,
      });

      if (owner !== user.id) {
        throw new HTTPException(403, { message: "FORBIDDEN" });
      }

      const newMaintainers = await filterNonExistingBucketMaintainers({
        bucketId,
        userIds,
      });

      await addBucketMaintainerInvitationsBatch({
        originUserId: user.id,
        invitations: newMaintainers,
        bucketId,
        bucketName,
      });

      return c.json({ message: "Maintainers invited" });
    }
  )
  .delete(
    "/",
    validator("param", (value) => {
      return paramSchema.parse(value);
    }),
    validator("json", async (value, c) => {
      return bucketMaintainersSchema.parse(value);
    }),
    async (c) => {
      const { bucketId } = c.req.valid("param");
      const { userIds } = c.req.valid("json");
      const user = c.get("user");

      const hasPermissions = await isBucketOwner({
        userId: user.id,
        bucketId,
      });

      if (!hasPermissions) {
        throw new HTTPException(403, { message: "FORBIDDEN" });
      }

      if (userIds.includes(user.id)) {
        throw new HTTPException(400, {
          message: "CANNOT_REMOVE_YOURSELF",
        });
      }

      await removeBucketMaintainersBatch({
        userIds,
        bucketId,
      });

      return c.json({ message: "Maintainers removed" });
    }
  );

export default app;
