import { afterAll, describe, expect, it, vi } from "vitest";
import {
  getBuckets,
  getBucketOwner,
  getBucketSize,
  increaseBucketSize,
  isBucketOwner,
  createBucket,
  deleteBucket,
  getUserBuckets,
  isBucketUser,
} from "../../../src/lib/db/queries/buckets.js";
import { createServiceClient } from "../../../src/utils/supabase/service-client.js";
import {
  cleanupTestData,
  generateTestData,
  TEST_USERS,
} from "./config/utils.js";

// Mock server-only module
vi.mock("server-only", () => {
  return {
    // mock server-only module
  };
});

describe("buckets.ts query tests", async () => {
  const testBuckets: { id: string }[] = [];
  let testBucketUsers: { bucket_id: string; user_id: string }[] = [];
  const testUserId1 = TEST_USERS.user1.id;
  const testUserId2 = TEST_USERS.user2.id;

  let testBucketId: string;
  let testBucketName: string;

  const supabase = createServiceClient();

  afterAll(async () => {
    // Clean up test data
    for (const bucketUser of testBucketUsers) {
      const { error } = await supabase
        .from("bucket_users")
        .delete()
        .eq("bucket_id", bucketUser.bucket_id)
        .eq("user_id", bucketUser.user_id);

      if (error) {
        console.warn("Error cleaning up bucket_users:", error);
      }
    }

    for (const bucket of testBuckets) {
      await cleanupTestData(supabase, "buckets", "id", bucket.id);
    }
  });

  it("should create a bucket", async () => {
    // Arrange
    const bucketData = generateTestData();
    testBucketName = bucketData.title;

    // Act
    await createBucket({
      userId: testUserId1,
      name: testBucketName,
      type: "small",
    });

    // Assert
    const { data: buckets, error } = await supabase
      .from("buckets")
      .select()
      .eq("owner", testUserId1)
      .eq("name", testBucketName);

    if (error) {
      throw error;
    }

    expect(buckets.length).toBe(1);

    testBucketId = buckets[0].id;
    testBuckets.push({ id: testBucketId });
  });

  it("should get buckets for a user", async () => {
    // Act
    const buckets = await getBuckets({ userId: testUserId1 });

    // Assert
    expect(Array.isArray(buckets)).toBe(true);
    expect(buckets.length).toBeGreaterThanOrEqual(1);
    expect(buckets.some((b) => b.id === testBucketId)).toBe(true);
  });

  it("should get bucket owner", async () => {
    // Act
    const data = await getBucketOwner({ bucketId: testBucketId });

    // Assert
    expect(data.owner).toBe(testUserId1);
    expect(data.name).toBe(testBucketName);
  });

  it("should check if user is bucket owner", async () => {
    // Act
    const isOwner = await isBucketOwner({
      userId: testUserId1,
      bucketId: testBucketId,
    });

    const isNotOwner = await isBucketOwner({
      userId: testUserId2,
      bucketId: testBucketId,
    });

    // Assert
    expect(isOwner).toBe(true);
    expect(isNotOwner).toBe(false);
  });

  it("should get bucket size", async () => {
    // Act
    const sizeInfo = await getBucketSize({ bucketId: testBucketId });

    // Assert
    expect(sizeInfo).toHaveProperty("size");
    expect(sizeInfo).toHaveProperty("maxSize");
    expect(typeof sizeInfo.size).toBe("number");
    expect(typeof sizeInfo.maxSize).toBe("number");
  });

  it("should increase bucket size", async () => {
    // Arrange
    const initialSizeInfo = await getBucketSize({ bucketId: testBucketId });
    const fileSizeToAdd = 1024 * 1024; // 1MB

    // Act
    await increaseBucketSize({
      bucketId: testBucketId,
      fileSize: fileSizeToAdd,
    });

    // Assert
    const updatedSizeInfo = await getBucketSize({ bucketId: testBucketId });
    expect(updatedSizeInfo.size).toBe(initialSizeInfo.size + fileSizeToAdd);
  });

  it("should check if a user is associated with a bucket", async () => {
    // Arrange
    const testData = generateTestData();
    const bucketId = testData.uuid;

    // Create a test bucket
    const { error } = await supabase
      .from("buckets")
      .insert({
        id: bucketId,
        owner: testUserId1,
        name: testData.title,
        max_size: 1024 * 1024 * 1024, // 1GB
        type: "small",
      })
      .select()
      .single();

    if (error) throw error;

    testBuckets.push({ id: bucketId });

    // Add the second user to the bucket
    const { error: bucketUserError } = await supabase
      .from("bucket_users")
      .insert({
        bucket_id: bucketId,
        user_id: testUserId2,
      });

    if (bucketUserError) throw bucketUserError;

    testBucketUsers.push({ bucket_id: bucketId, user_id: testUserId2 });

    // Act - Check owner
    const isOwnerABucketUser = await isBucketUser({
      userId: testUserId1,
      bucketId,
    });

    // Act - Check added user
    const isUser2ABucketUser = await isBucketUser({
      userId: testUserId2,
      bucketId,
    });

    // Assert
    expect(isOwnerABucketUser).toBe(false); // Owner is not in bucket_users
    expect(isUser2ABucketUser).toBe(true); // User2 is in bucket_users
  });

  it("should get user's buckets", async () => {
    // Arrange
    // Create two test buckets
    const testData1 = generateTestData();
    const bucketId1 = testData1.uuid;

    const testData2 = generateTestData();
    const bucketId2 = testData2.uuid;

    // Create buckets owned by user1
    await supabase.from("buckets").insert([
      {
        id: bucketId1,
        owner: testUserId1,
        name: testData1.title,
        max_size: 1024 * 1024 * 1024, // 1GB
        type: "small",
      },
      {
        id: bucketId2,
        owner: testUserId1,
        name: testData2.title,
        max_size: 1024 * 1024 * 1024, // 1GB
        type: "small",
      },
    ]);

    testBuckets.push({ id: bucketId1 }, { id: bucketId2 });

    // Add user2 to both buckets
    await supabase.from("bucket_users").insert([
      {
        bucket_id: bucketId1,
        user_id: testUserId2,
      },
      {
        bucket_id: bucketId2,
        user_id: testUserId2,
      },
    ]);

    testBucketUsers.push(
      { bucket_id: bucketId1, user_id: testUserId2 },
      { bucket_id: bucketId2, user_id: testUserId2 }
    );

    // Act
    const results = await getUserBuckets({ userId: testUserId2 });

    // Assert
    expect(results.length).toBeGreaterThanOrEqual(2);

    // Extract bucket IDs
    const bucketIds = results.map((item) => item.bucket_id);

    // Check if both our test buckets are included
    expect(bucketIds).toContain(bucketId1);
    expect(bucketIds).toContain(bucketId2);
  });

  it("should add a user to bucket and then delete bucket", async () => {
    // Arrange - Add a user to the bucket
    const { error: addUserError } = await supabase.from("bucket_users").insert({
      bucket_id: testBucketId,
      user_id: testUserId2,
    });

    if (addUserError) {
      throw addUserError;
    }

    testBucketUsers.push({
      bucket_id: testBucketId,
      user_id: testUserId2,
    });

    // Act
    const result = await deleteBucket({ bucketId: testBucketId });

    // Assert
    expect(result.name).toBe(testBucketName);

    const { data: buckets, error } = await supabase
      .from("buckets")
      .select()
      .eq("id", testBucketId);

    if (error) {
      throw error;
    }

    expect(buckets.length).toBe(0);

    // Remove from tracking arrays
    const bucketIndex = testBuckets.findIndex((b) => b.id === testBucketId);
    if (bucketIndex !== -1) {
      testBuckets.splice(bucketIndex, 1);
    }

    testBucketUsers = testBucketUsers.filter(
      (bu) => bu.bucket_id !== testBucketId
    );
  });
});
