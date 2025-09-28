import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { filterNonExistingBucketUsers } from "../../../../lib/db/queries/bucket-users.js";
import { getBucketOwner } from "../../../../lib/db/queries/buckets.js";
import { addUserInvitationsBatch } from "../../../../lib/db/queries/invitations.js";
import { uuidSchema } from "../../../../schemas/uuid-schema.js";
import { bucketUsersSchema } from "./schema.js";

export async function POST(c: Context) {
  const bucketId = uuidSchema.parse(c.req.param("bucketId"));

  const user = c.get("user");

  const { owner, name: bucketName } = await getBucketOwner({
    bucketId,
  });

  if (owner !== user.id) {
    throw new HTTPException(403, { message: "Forbidden" });
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

  return c.json("Users invited");
}
