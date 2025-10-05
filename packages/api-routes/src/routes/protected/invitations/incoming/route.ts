import * as z from "zod";

import { invitationTypeSchema } from "@workspace/api-routes/schemas/invitation-type-schema.js";
import { itemsPerPageSchema } from "@workspace/api-routes/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@workspace/api-routes/schemas/page-number-schema.js";
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
          originUsername: profile.username,
          target: userInvitations.target,
          resourceId: userInvitations.bucketId,
          createdAt: userInvitations.createdAt,
          resourceName: userInvitations.bucketName,
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
          originUsername: profile.username,
          target: courseMaintainerInvitations.target,
          resourceId: courseMaintainerInvitations.courseId,
          createdAt: courseMaintainerInvitations.createdAt,
          resourceName: courseMaintainerInvitations.courseName,
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
          originUsername: profile.username,
          target: bucketMaintainerInvitations.target,
          resourceId: bucketMaintainerInvitations.bucketId,
          createdAt: bucketMaintainerInvitations.createdAt,
          resourceName: bucketMaintainerInvitations.bucketName,
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
);

export default app;
