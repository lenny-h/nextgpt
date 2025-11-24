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
  createTestBucket,
  createTestCourse,
  createTestTask,
} from "../helpers/db-helpers.js";

describe("Protected API Routes - Tasks", () => {
  const client = testClient<ApiAppType>(app);

  let user1Cookie: string;
  let user2Cookie: string;
  let courseId: string;
  let taskId: string;

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
    courseId = await createTestCourse(
      TEST_USER_IDS.USER1_VERIFIED,
      bucketId
    );
    taskId = await createTestTask(courseId);
  });

  describe("GET /api/protected/tasks/:courseId", () => {
    it("should return tasks for a course", async () => {
      const res = await client.api.protected.tasks[":courseId"].$get(
        {
          param: {
            courseId: courseId,
          },
          query: {
            pageNumber: "0",
            itemsPerPage: "10",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);
      const tasks = await res.json();
      expect(Array.isArray(tasks)).toBe(true);
      // Should contain at least the seeded task
      expect(tasks.some((t) => t.id === taskId)).toBe(true);
    });
  });

  describe("DELETE /api/protected/tasks/:taskId", () => {
    it("should not allow unauthorized user to delete task", async () => {
      const res = await client.api.protected.tasks[":taskId"].$delete(
        {
          param: {
            taskId: taskId,
          },
        },
        {
          headers: getAuthHeaders(user2Cookie),
        }
      );

      expect(res.status).toBe(403);
    });
  });
});
