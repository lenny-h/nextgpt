import { db } from "@workspace/server/drizzle/db.js";
import {
  courseMaintainerInvitations,
  courseUserRoles,
} from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { testClient } from "hono/testing";
import { beforeAll, describe, expect, it } from "vitest";
import app, { type ApiAppType } from "../../src/app.js";
import {
  getAuthHeaders,
  signInTestUser,
  TEST_USER_IDS,
  TEST_USERS,
} from "../helpers/auth-helpers.js";
import {
  addCourseMaintainer,
  createTestBucket,
  createTestCourse,
} from "../helpers/db-helpers.js";

describe("Protected API Routes - Course Maintainers", () => {
  const client = testClient<ApiAppType>(app);

  let user1Cookie: string;
  let user2Cookie: string;
  let courseId: string;

  beforeAll(async () => {
    user1Cookie = await signInTestUser(
      TEST_USERS.USER1_VERIFIED.email,
      TEST_USERS.USER1_VERIFIED.password
    );

    user2Cookie = await signInTestUser(
      TEST_USERS.USER2_VERIFIED.email,
      TEST_USERS.USER2_VERIFIED.password
    );

    // Create dynamic data
    const bucketId = await createTestBucket(TEST_USER_IDS.USER1_VERIFIED);
    courseId = await createTestCourse(TEST_USER_IDS.USER1_VERIFIED, bucketId);
  });

  describe("GET /api/protected/course-maintainers/:courseId", () => {
    it("should return maintainers for a course", async () => {
      const res = await client.api.protected["course-maintainers"][
        ":courseId"
      ].$get(
        {
          param: {
            courseId: courseId,
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);
      const maintainers = await res.json();
      expect(Array.isArray(maintainers)).toBe(true);
      // Owner should be a maintainer
      expect(
        maintainers.some((m) => m.id === TEST_USER_IDS.USER1_VERIFIED)
      ).toBe(true);
    });
  });

  describe("POST /api/protected/course-maintainers/:courseId", () => {
    it("should invite a maintainer to course", async () => {
      const res = await client.api.protected["course-maintainers"][
        ":courseId"
      ].$post(
        {
          param: {
            courseId: courseId,
          },
          json: {
            userIds: [TEST_USER_IDS.USER2_VERIFIED],
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toBe("Maintainers invited");

      // Verify invitation in DB
      const [invitation] = await db
        .select()
        .from(courseMaintainerInvitations)
        .where(
          and(
            eq(courseMaintainerInvitations.courseId, courseId),
            eq(courseMaintainerInvitations.target, TEST_USER_IDS.USER2_VERIFIED)
          )
        );
      expect(invitation).toBeDefined();
      expect(invitation.courseId).toBe(courseId);
    });

    it("should not allow non-maintainer to invite", async () => {
      const res = await client.api.protected["course-maintainers"][
        ":courseId"
      ].$post(
        {
          param: {
            courseId: courseId,
          },
          json: {
            userIds: [TEST_USER_IDS.USER3_UNVERIFIED],
          },
        },
        {
          headers: getAuthHeaders(user2Cookie),
        }
      );

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/protected/course-maintainers/:courseId", () => {
    it("should remove a maintainer from course", async () => {
      // Ensure user2 is a maintainer first
      await addCourseMaintainer(courseId, TEST_USER_IDS.USER2_VERIFIED);

      const res = await client.api.protected["course-maintainers"][
        ":courseId"
      ].$delete(
        {
          param: {
            courseId: courseId,
          },
          json: {
            userIds: [TEST_USER_IDS.USER2_VERIFIED],
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toBe("Maintainers removed");

      // Verify removal from DB
      const [removedRole] = await db
        .select()
        .from(courseUserRoles)
        .where(
          and(
            eq(courseUserRoles.courseId, courseId),
            eq(courseUserRoles.userId, TEST_USER_IDS.USER2_VERIFIED)
          )
        );
      expect(removedRole).toBeUndefined();
    });
  });
});
