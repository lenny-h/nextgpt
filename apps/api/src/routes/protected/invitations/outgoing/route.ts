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
import { Hono } from "hono";
import { validator } from "hono/validator";
import * as z from "zod";

const querySchema = z
  .object({
    pageNumber: pageNumberSchema,
    itemsPerPage: itemsPerPageSchema,
    invitationType: invitationTypeSchema,
  })
  .strict();

const app = new Hono().get(
  "/",
  validator("query", (value) => {
    return querySchema.parse(value);
  }),
  async (c) => {
    const { pageNumber, itemsPerPage, invitationType } = c.req.valid("query");
    const user = c.get("user");
    const offset = pageNumber * itemsPerPage;

    let result;

    if (invitationType === "user") {
      result = await db
        .select({
          origin: userInvitations.origin,
          target: userInvitations.target,
          target_username: profile.username,
          resource_id: userInvitations.bucketId,
          created_at: userInvitations.createdAt,
          resource_name: userInvitations.bucketName,
        })
        .from(userInvitations)
        .innerJoin(profile, eq(profile.id, userInvitations.target))
        .where(eq(userInvitations.origin, user.id))
        .orderBy(desc(userInvitations.createdAt))
        .limit(itemsPerPage)
        .offset(offset);
    } else if (invitationType === "course_maintainer") {
      result = await db
        .select({
          origin: courseMaintainerInvitations.origin,
          target: courseMaintainerInvitations.target,
          target_username: profile.username,
          resource_id: courseMaintainerInvitations.courseId,
          created_at: courseMaintainerInvitations.createdAt,
          resource_name: courseMaintainerInvitations.courseName,
        })
        .from(courseMaintainerInvitations)
        .innerJoin(profile, eq(profile.id, courseMaintainerInvitations.target))
        .where(eq(courseMaintainerInvitations.origin, user.id))
        .orderBy(desc(courseMaintainerInvitations.createdAt))
        .limit(itemsPerPage)
        .offset(offset);
    } else if (invitationType === "bucket_maintainer") {
      result = await db
        .select({
          origin: bucketMaintainerInvitations.origin,
          target: bucketMaintainerInvitations.target,
          target_username: profile.username,
          resource_id: bucketMaintainerInvitations.bucketId,
          created_at: bucketMaintainerInvitations.createdAt,
          resource_name: bucketMaintainerInvitations.bucketName,
        })
        .from(bucketMaintainerInvitations)
        .innerJoin(profile, eq(profile.id, bucketMaintainerInvitations.target))
        .where(eq(bucketMaintainerInvitations.origin, user.id))
        .orderBy(desc(bucketMaintainerInvitations.createdAt))
        .limit(itemsPerPage)
        .offset(offset);
    }

    return c.json({ invitations: result });
  }
);

export default app;
