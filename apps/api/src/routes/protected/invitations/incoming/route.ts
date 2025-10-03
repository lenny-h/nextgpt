import { invitationTypeSchema } from "@/src/schemas/invitation-type-schema.js";
import { itemsPerPageSchema } from "@/src/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@/src/schemas/page-number-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import {
  bucketMaintainerInvitations,
  courseMaintainerInvitations,
  user as profile,
  userInvitations,
} from "@workspace/server/drizzle/schema.js";
import { desc, eq } from "drizzle-orm";
import { type Context } from "hono";

export async function GET(c: Context) {
  const pageNumber = pageNumberSchema.parse(c.req.query("pageNumber"));
  const itemsPerPage = itemsPerPageSchema.parse(c.req.query("itemsPerPage"));
  const invitationType = invitationTypeSchema.parse(
    c.req.query("invitationType")
  );

  const user = c.get("user");
  const offset = pageNumber * itemsPerPage;

  let result;

  if (invitationType === "user") {
    result = await db
      .select({
        origin: userInvitations.origin,
        origin_username: profile.username,
        target: userInvitations.target,
        resource_id: userInvitations.bucketId,
        created_at: userInvitations.createdAt,
        resource_name: userInvitations.bucketName,
      })
      .from(userInvitations)
      .innerJoin(profile, eq(profile.id, userInvitations.origin))
      .where(eq(userInvitations.target, user.id))
      .orderBy(desc(userInvitations.createdAt))
      .limit(itemsPerPage)
      .offset(offset);
  } else if (invitationType === "course_maintainer") {
    result = await db
      .select({
        origin: courseMaintainerInvitations.origin,
        origin_username: profile.username,
        target: courseMaintainerInvitations.target,
        resource_id: courseMaintainerInvitations.courseId,
        created_at: courseMaintainerInvitations.createdAt,
        resource_name: courseMaintainerInvitations.courseName,
      })
      .from(courseMaintainerInvitations)
      .innerJoin(profile, eq(profile.id, courseMaintainerInvitations.origin))
      .where(eq(courseMaintainerInvitations.target, user.id))
      .orderBy(desc(courseMaintainerInvitations.createdAt))
      .limit(itemsPerPage)
      .offset(offset);
  } else if (invitationType === "bucket_maintainer") {
    result = await db
      .select({
        origin: bucketMaintainerInvitations.origin,
        origin_username: profile.username,
        target: bucketMaintainerInvitations.target,
        resource_id: bucketMaintainerInvitations.bucketId,
        created_at: bucketMaintainerInvitations.createdAt,
        resource_name: bucketMaintainerInvitations.bucketName,
      })
      .from(bucketMaintainerInvitations)
      .innerJoin(profile, eq(profile.id, bucketMaintainerInvitations.origin))
      .where(eq(bucketMaintainerInvitations.target, user.id))
      .orderBy(desc(bucketMaintainerInvitations.createdAt))
      .limit(itemsPerPage)
      .offset(offset);
  }

  return c.json({ invitations: result });
}
