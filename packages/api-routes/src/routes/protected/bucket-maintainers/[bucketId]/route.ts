import * as z from "zod";

import {
  filterNonExistingBucketMaintainers,
  removeBucketMaintainersBatch,
} from "@workspace/api-routes/lib/db/queries/bucket-maintainers.js";
import {
  getBucketOwner,
  isBucketOwner,
} from "@workspace/api-routes/lib/db/queries/buckets.js";
import { addBucketMaintainerInvitationsBatch } from "@workspace/api-routes/lib/db/queries/invitations.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import {
  bucketUserRoles,
  user as profile,
} from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { bucketMaintainersSchema } from "./schema.js";

const paramSchema = z.object({ bucketId: uuidSchema }).strict();

const app = new Hono()
  .get(
    "/",
    validator("param", (value, c) => {
      const parsed = paramSchema.safeParse(value);
      if (!parsed.success) {
        return c.text("BAD_REQUEST", 400);
      }
      return parsed.data;
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
          id: bucketUserRoles.userId,
          username: profile.username,
        })
        .from(bucketUserRoles)
        .innerJoin(profile, eq(bucketUserRoles.userId, profile.id))
        .where(
          and(
            eq(bucketUserRoles.bucketId, bucketId),
            eq(bucketUserRoles.role, "maintainer")
          )
        );

      return c.json(maintainers);
    }
  )
  .post(
    "/",
    validator("param", (value, c) => {
      const parsed = paramSchema.safeParse(value);
      if (!parsed.success) {
        return c.text("BAD_REQUEST", 400);
      }
      return parsed.data;
    }),
    validator("json", async (value, c) => {
      const parsed = bucketMaintainersSchema.safeParse(value);
      if (!parsed.success) {
        return c.text("BAD_REQUEST", 400);
      }
      return parsed.data;
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
    validator("param", (value, c) => {
      const parsed = paramSchema.safeParse(value);
      if (!parsed.success) {
        return c.text("BAD_REQUEST", 400);
      }
      return parsed.data;
    }),
    validator("json", async (value, c) => {
      const parsed = bucketMaintainersSchema.safeParse(value);
      if (!parsed.success) {
        return c.text("BAD_REQUEST", 400);
      }
      return parsed.data;
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
