import { isBucketMaintainer } from "@/src/lib/db/queries/bucket-maintainers.js";
import { filterNonExistingBucketUsers } from "@/src/lib/db/queries/bucket-users.js";
import { getBucketOwner } from "@/src/lib/db/queries/buckets.js";
import { addUserInvitationsBatch } from "@/src/lib/db/queries/invitations.js";
import { itemsPerPageSchema } from "@/src/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@/src/schemas/page-number-schema.js";
import { createUuidArrayParamSchema } from "@/src/schemas/uuid-array-param-schema.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import {
  bucketUsers,
  user as profile,
} from "@workspace/server/drizzle/schema.js";
import { and, eq, inArray } from "drizzle-orm";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { bucketUsersSchema } from "./schema.js";

// Get bucket users
export async function GET(c: Context) {
  const bucketId = uuidSchema.parse(c.req.param("bucketId"));
  const pageNumber = pageNumberSchema.parse(c.req.query("pageNumber"));
  const itemsPerPage = itemsPerPageSchema.parse(c.req.query("itemsPerPage"));

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

// Invite bucket users
export async function POST(c: Context) {
  const bucketId = uuidSchema.parse(c.req.param("bucketId"));

  const user = c.get("user");

  const { owner, name: bucketName } = await getBucketOwner({
    bucketId,
  });

  if (owner !== user.id) {
    throw new HTTPException(403, { message: "FORBIDDEN" });
  }

  const payload = await c.req.json();

  const { userIds } = bucketUsersSchema.parse(payload);

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

// Remove bucket users
export async function DELETE(c: Context) {
  const bucketId = uuidSchema.parse(c.req.param("bucketId"));
  const userIds = createUuidArrayParamSchema(100).parse(c.req.query("userIds")); // max 100 userIds

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
