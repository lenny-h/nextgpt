import * as z from "zod";

import { isBucketMaintainer } from "@workspace/api-routes/lib/db/queries/bucket-maintainers.js";
import { filterNonExistingBucketUsers } from "@workspace/api-routes/lib/db/queries/bucket-users.js";
import { getBucketOwner } from "@workspace/api-routes/lib/db/queries/buckets.js";
import { addUserInvitationsBatch } from "@workspace/api-routes/lib/db/queries/invitations.js";
import { itemsPerPageSchema } from "@workspace/api-routes/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@workspace/api-routes/schemas/page-number-schema.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import {
  bucketUserRoles,
  user as profile,
} from "@workspace/server/drizzle/schema.js";
import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { bucketUsersSchema } from "./schema.js";

const paramSchema = z.object({ bucketId: uuidSchema }).strict();
const querySchema = z
  .object({
    pageNumber: pageNumberSchema,
    itemsPerPage: itemsPerPageSchema,
  })
  .strict();

const app = new Hono()
  .get(
    "/",
    validator("param", (value, c) => {
      const parsed = paramSchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
    }),
    validator("query", (value, c) => {
      const parsed = querySchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
    }),
    async (c) => {
      const { bucketId } = c.req.valid("param");
      const { pageNumber, itemsPerPage } = c.req.valid("query");
      const user = c.get("user");

      const hasPermissions = await isBucketMaintainer({
        bucketId,
        userId: user.id,
      });

      if (!hasPermissions) {
        throw new HTTPException(403, { message: "FORBIDDEN" });
      }

      const users = await db
        .select({
          id: bucketUserRoles.userId,
          username: profile.username,
        })
        .from(bucketUserRoles)
        .innerJoin(profile, eq(bucketUserRoles.userId, profile.id))
        .where(eq(bucketUserRoles.bucketId, bucketId))
        .limit(itemsPerPage)
        .offset(pageNumber * itemsPerPage);

      return c.json(users);
    }
  )
  .post(
    "/",
    validator("param", (value, c) => {
      const parsed = paramSchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
    }),
    validator("json", async (value, c) => {
      const parsed = bucketUsersSchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
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

      const newUsers = await filterNonExistingBucketUsers({
        bucketId,
        userIds,
      });

      await addUserInvitationsBatch({
        originUserId: user.id,
        invitations: newUsers,
        bucketId,
        bucketName,
      });

      return c.json({ message: "Users invited" });
    }
  )
  .delete(
    "/",
    validator("param", (value, c) => {
      const parsed = paramSchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
    }),
    validator("json", (value, c) => {
      const parsed = bucketUsersSchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
    }),
    async (c) => {
      const { bucketId } = c.req.valid("param");
      const { userIds } = c.req.valid("json");
      const user = c.get("user");

      const hasPermissions = await isBucketMaintainer({
        bucketId,
        userId: user.id,
      });

      if (!hasPermissions) {
        throw new HTTPException(403, { message: "FORBIDDEN" });
      }

      await db
        .delete(bucketUserRoles)
        .where(
          and(
            eq(bucketUserRoles.bucketId, bucketId),
            inArray(bucketUserRoles.userId, userIds)
          )
        );

      return c.json({ message: "Users removed" });
    }
  );

export default app;
