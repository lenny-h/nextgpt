import { isBucketMaintainer } from "@/src/lib/db/queries/bucket-maintainers.js";
import {
  filterNonExistingCourseMaintainers,
  removeCourseMaintainersBatch,
} from "@/src/lib/db/queries/course-maintainers.js";
import {
  getBucketIdByCourseId,
  getCourseDetails,
} from "@/src/lib/db/queries/courses.js";
import { addCourseMaintainerInvitationsBatch } from "@/src/lib/db/queries/invitations.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import {
  courseMaintainers,
  user as profile,
} from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import * as z from "zod";
import { courseMaintainersSchema } from "./schema.js";

const paramSchema = z.object({ courseId: uuidSchema }).strict();

const app = new Hono()
  .get(
    "/",
    validator("param", (value) => {
      return paramSchema.parse(value);
    }),
    async (c) => {
      const { courseId } = c.req.valid("param");

      const user = c.get("user");

      const bucketId = await getBucketIdByCourseId({ courseId });

      const hasPermissions = await isBucketMaintainer({
        userId: user.id,
        bucketId,
      });

      if (!hasPermissions) {
        throw new HTTPException(403, { message: "FORBIDDEN" });
      }

      const maintainers = await db
        .select({
          id: courseMaintainers.userId,
          username: profile.username,
        })
        .from(courseMaintainers)
        .innerJoin(profile, eq(courseMaintainers.userId, profile.id))
        .where(eq(courseMaintainers.courseId, courseId));

      return c.json({ maintainers });
    }
  )
  .post(
    "/",
    validator("param", (value) => {
      return paramSchema.parse(value);
    }),
    validator("json", async (value, c) => {
      return courseMaintainersSchema.parse(value);
    }),
    async (c) => {
      const { courseId } = c.req.valid("param");

      const { userIds } = c.req.valid("json");
      const user = c.get("user");

      const { bucketId, name } = await getCourseDetails({
        courseId,
      });

      const hasPermissions = await isBucketMaintainer({
        userId: user.id,
        bucketId,
      });

      if (!hasPermissions) {
        throw new HTTPException(403, { message: "FORBIDDEN" });
      }

      const newMaintainers = await filterNonExistingCourseMaintainers({
        courseId,
        userIds,
      });

      await addCourseMaintainerInvitationsBatch({
        originUserId: user.id,
        invitations: newMaintainers,
        courseId,
        courseName: name,
      });

      return c.json({ message: "Maintainers invited" });
    }
  )
  .delete(
    "/",
    validator("param", (value) => {
      return paramSchema.parse(value);
    }),
    validator("json", async (value, c) => {
      return courseMaintainersSchema.parse(value);
    }),
    async (c) => {
      const { courseId } = c.req.valid("param");
      const { userIds } = c.req.valid("json");
      const user = c.get("user");

      const { bucketId } = await getCourseDetails({
        courseId,
      });

      const hasPermissions = await isBucketMaintainer({
        userId: user.id,
        bucketId,
      });

      if (!hasPermissions) {
        throw new HTTPException(403, { message: "FORBIDDEN" });
      }

      if (userIds.includes(user.id)) {
        throw new HTTPException(400, { message: "CANNOT_REMOVE_YOURSELF" });
      }

      await removeCourseMaintainersBatch({
        userIds,
        courseId,
      });

      return c.json({ message: "Maintainers removed" });
    }
  );

export default app;
