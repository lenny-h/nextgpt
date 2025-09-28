import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  filterNonExistingBucketMaintainers,
  removeBucketMaintainersBatch,
} from "../../../../lib/db/queries/bucket-maintainers.js";
import {
  getBucketName,
  isBucketOwner,
} from "../../../../lib/db/queries/buckets.js";
import { addBucketMaintainerInvitationsBatch } from "../../../../lib/db/queries/invitations.js";
import { uuidSchema } from "../../../../schemas/uuid-schema.js";
import { bucketMaintainersSchema } from "./schema.js";

export async function POST(c: Context) {
  const bucketId = c.req.param("bucketId");

  const user = c.get("user");

  if (!uuidSchema.safeParse(bucketId).success) {
    throw new HTTPException(400, { message: "Invalid bucket ID" });
  }

  const hasPermissions = await isBucketOwner({
    userId: user.id,
    bucketId,
  });

  if (!hasPermissions) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  const payload = await c.req.json();

  const { userIds } = bucketMaintainersSchema.parse(payload);

  const newMaintainers = await filterNonExistingBucketMaintainers({
    bucketId,
    userIds,
  });

  const name = await getBucketName({
    bucketId,
  });

  await addBucketMaintainerInvitationsBatch({
    originUserId: user.id,
    invitations: newMaintainers,
    bucketId,
    bucketName: name,
  });

  return c.json("Maintainers invited");
}

export async function DELETE(c: Context) {
  const bucketId = uuidSchema.parse(c.req.param("bucketId"));

  const user = c.get("user");

  const hasPermissions = await isBucketOwner({
    userId: user.id,
    bucketId,
  });

  if (!hasPermissions) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  const payload = await c.req.json();

  const { userIds } = bucketMaintainersSchema.parse(payload);

  if (userIds.includes(user.id)) {
    throw new HTTPException(400, {
      message: "Cannot remove yourself as a maintainer",
    });
  }

  await removeBucketMaintainersBatch({
    userIds,
    bucketId,
  });

  return c.json("Maintainers removed");
}
