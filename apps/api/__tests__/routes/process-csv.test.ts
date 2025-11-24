import { testClient } from "hono/testing";
import { beforeAll, describe, expect, it } from "vitest";
import app, { type ApiAppType } from "../../src/app.js";
import {
  getAuthHeaders,
  signInTestUser,
  TEST_USER_IDS,
  TEST_USERS,
} from "../helpers/auth-helpers.js";
import { createTestBucket } from "../helpers/db-helpers.js";

describe("Protected API Routes - Process CSV", () => {
  const client = testClient<ApiAppType>(app);

  let user1Cookie: string;
  let user2Cookie: string;
  let bucketId: string;

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
    bucketId = await createTestBucket(TEST_USER_IDS.USER1_VERIFIED);
  });

  describe("POST /api/protected/process-csv/:bucketId", () => {
    it("should process CSV upload", async () => {
      // Create a simple CSV content with valid test usernames
      const csvContent = `${TEST_USERS.USER2_VERIFIED.username}\n${TEST_USERS.USER3_UNVERIFIED.username}`;
      const blob = new Blob([csvContent], { type: "text/csv" });
      const file = new File([blob], "users.csv", { type: "text/csv" });

      const res = await client.api.protected["process-csv"][":bucketId"].$post(
        {
          param: {
            bucketId: bucketId,
          },
          form: {
            file,
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      console.log("Response status:", res.status);
      if (res.status !== 200) {
        const errorText = await res.text();
        console.log("Error response:", errorText);
      }

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("nameCount");
      expect(data.nameCount).toBe(2);
    });

    it("should not allow unauthorized user to process CSV", async () => {
      const csvContent = `${TEST_USERS.USER2_VERIFIED.username}\n${TEST_USERS.USER3_UNVERIFIED.username}`;
      const blob = new Blob([csvContent], { type: "text/csv" });
      const file = new File([blob], "users.csv", { type: "text/csv" });

      const res = await client.api.protected["process-csv"][":bucketId"].$post(
        {
          param: {
            bucketId: bucketId,
          },
          form: {
            file,
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
