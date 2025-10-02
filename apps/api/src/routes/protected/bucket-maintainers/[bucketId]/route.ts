import {
  filterNonExistingBucketMaintainers,
  removeBucketMaintainersBatch,
} from "@/src/lib/db/queries/bucket-maintainers.js";
import { getBucketOwner, isBucketOwner } from "@/src/lib/db/queries/buckets.js";
import { addBucketMaintainerInvitationsBatch } from "@/src/lib/db/queries/invitations.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { bucketMaintainersSchema } from "./schema.js";
import {
  bucketMaintainers,
  user as profile,
} from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";

// Get bucket maintainers
export async function GET(c: Context) {
  const bucketId = uuidSchema.parse(c.req.param("bucketId"));

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

  return c.json(maintainers);
}

// Add bucket maintainers
export async function POST(c: Context) {
  const bucketId = c.req.param("bucketId");

  const user = c.get("user");

  if (!uuidSchema.safeParse(bucketId).success) {
    throw new HTTPException(400, { message: "INVALID_BUCKET_ID" });
  }

  const { owner, name: bucketName } = await getBucketOwner({
    bucketId,
  });

  if (owner !== user.id) {
    throw new HTTPException(403, { message: "FORBIDDEN" });
  }

  const payload = await c.req.json();

  const { userIds } = bucketMaintainersSchema.parse(payload);

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

  return c.json("Maintainers invited");
}

// Remove bucket maintainers
export async function DELETE(c: Context) {
  const bucketId = uuidSchema.parse(c.req.param("bucketId"));

  const user = c.get("user");

  const hasPermissions = await isBucketOwner({
    userId: user.id,
    bucketId,
  });

  if (!hasPermissions) {
    throw new HTTPException(403, { message: "FORBIDDEN" });
  }

  const payload = await c.req.json();

  const { userIds } = bucketMaintainersSchema.parse(payload);

  if (userIds.includes(user.id)) {
    throw new HTTPException(400, {
      message: "CANNOT_REMOVE_YOURSELF",
    });
  }

  await removeBucketMaintainersBatch({
    userIds,
    bucketId,
  });

  return c.json("Maintainers removed");
}
