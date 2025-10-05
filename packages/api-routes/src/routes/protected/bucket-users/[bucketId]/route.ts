import * as z from "zod";

import { isBucketMaintainer } from "@workspace/api-routes/lib/db/queries/bucket-maintainers.js";
import { filterNonExistingBucketUsers } from "@workspace/api-routes/lib/db/queries/bucket-users.js";
import { getBucketOwner } from "@workspace/api-routes/lib/db/queries/buckets.js";
import { addUserInvitationsBatch } from "@workspace/api-routes/lib/db/queries/invitations.js";
import { itemsPerPageSchema } from "@workspace/api-routes/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@workspace/api-routes/schemas/page-number-schema.js";
import { createUuidArrayParamSchema } from "@workspace/api-routes/schemas/uuid-array-param-schema.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import {
  bucketUsers,
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
const deleteQuerySchema = z
  .object({
    userIds: createUuidArrayParamSchema(100),
  })
  .strict();

const app = new Hono()
  .get(
    "/",
    validator("param", (value) => {
      return paramSchema.parse(value);
    }),
    validator("query", (value) => {
      return querySchema.parse({
        pageNumber: Number(value.pageNumber),
        itemsPerPage: Number(value.itemsPerPage),
      });
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
          id: bucketUsers.userId,
          username: profile.username,
        })
        .from(bucketUsers)
        .innerJoin(profile, eq(bucketUsers.userId, profile.id))
        .where(eq(bucketUsers.bucketId, bucketId))
        .limit(itemsPerPage)
        .offset(pageNumber * itemsPerPage);

      return c.json({ users });
    }
  )
  .post(
    "/",
    validator("param", (value) => {
      return paramSchema.parse(value);
    }),
    validator("json", async (value, c) => {
      return bucketUsersSchema.parse(value);
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
    validator("param", (value) => {
      return paramSchema.parse(value);
    }),
    validator("json", (value) => {
      return deleteQuerySchema.parse(value);
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
        .delete(bucketUsers)
        .where(
          and(
            eq(bucketUsers.bucketId, bucketId),
            inArray(bucketUsers.userId, userIds)
          )
        );

      return c.json({ message: "Users removed" });
    }
  );

export default app;
