import { db } from "@workspace/server/drizzle/db.js";
import {
  bucketMaintainerInvitations,
  bucketUserRoles,
} from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app, { type ApiAppType } from "../../src/app.js";
import {
  getAuthHeaders,
  signInTestUser,
  TEST_USER_IDS,
  TEST_USERS,
} from "../helpers/auth-helpers.js";
import {
  addBucketMaintainer,
  cleanupUserBucket,
  createTestBucket,
} from "../helpers/db-helpers.js";

describe("Protected API Routes - Bucket Maintainers", () => {
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

    // Create dynamic bucket for User 1
    bucketId = await createTestBucket(TEST_USER_IDS.USER1_VERIFIED);
  });

  afterAll(async () => {
    await cleanupUserBucket(bucketId);
  });

  describe("GET /api/protected/bucket-maintainers/:bucketId", () => {
    it("should return maintainers for a bucket", async () => {
      const res = await client.api.protected["bucket-maintainers"][
        ":bucketId"
      ].$get(
        {
          param: {
            bucketId: bucketId,
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);
      const maintainers = await res.json();
      expect(Array.isArray(maintainers)).toBe(true);
      expect(maintainers.length).toBeGreaterThan(0);
      expect(maintainers[0].id).toBe(TEST_USER_IDS.USER1_VERIFIED);
    });

    it("should not allow non-owner to get maintainers", async () => {
      const res = await client.api.protected["bucket-maintainers"][
        ":bucketId"
      ].$get(
        {
          param: {
            bucketId: bucketId,
          },
        },
        {
          headers: getAuthHeaders(user2Cookie),
        }
      );

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/protected/bucket-maintainers/:bucketId", () => {
    it("should invite a maintainer", async () => {
      const res = await client.api.protected["bucket-maintainers"][
        ":bucketId"
      ].$post(
        {
          param: {
            bucketId: bucketId,
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
        .from(bucketMaintainerInvitations)
        .where(
          and(
            eq(bucketMaintainerInvitations.bucketId, bucketId),
            eq(bucketMaintainerInvitations.target, TEST_USER_IDS.USER2_VERIFIED)
          )
        );
      expect(invitation).toBeDefined();
      expect(invitation.bucketId).toBe(bucketId);
      expect(invitation.target).toBe(TEST_USER_IDS.USER2_VERIFIED);
    });

    it("should not allow non-owner to invite maintainer", async () => {
      const res = await client.api.protected["bucket-maintainers"][
        ":bucketId"
      ].$post(
        {
          param: {
            bucketId: bucketId,
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

  describe("DELETE /api/protected/bucket-maintainers/:bucketId", () => {
    it("should remove a maintainer", async () => {
      // First ensure user2 is a maintainer by directly adding to DB
      await addBucketMaintainer(bucketId, TEST_USER_IDS.USER2_VERIFIED);

      const res = await client.api.protected["bucket-maintainers"][
        ":bucketId"
      ].$delete(
        {
          param: {
            bucketId: bucketId,
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
        .from(bucketUserRoles)
        .where(
          and(
            eq(bucketUserRoles.bucketId, bucketId),
            eq(bucketUserRoles.userId, TEST_USER_IDS.USER2_VERIFIED)
          )
        );
      expect(removedRole).toBeUndefined();
    });

    it("should not allow non-owner to remove maintainer", async () => {
      const res = await client.api.protected["bucket-maintainers"][
        ":bucketId"
      ].$delete(
        {
          param: {
            bucketId: bucketId,
          },
          json: {
            userIds: [TEST_USER_IDS.USER1_VERIFIED],
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
