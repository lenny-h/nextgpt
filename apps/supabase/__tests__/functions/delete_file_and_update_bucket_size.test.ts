import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("delete_file_and_update_bucket_size function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testBucketId: string;
  let testCourseId: string;
  let testFileId: string;
  let testFile2Id: string;
  let fileSize: number;
  let file2Size: number;

  beforeAll(async () => {
    user1Client = await signInUser(
      TEST_USERS.user1.email,
      TEST_USERS.user1.password
    );
    user2Client = await signInUser(
      TEST_USERS.user2.email,
      TEST_USERS.user2.password
    );
    anonymousClient = createUnauthenticatedClient();
    serviceClient = createServiceClient();

    // Create a test bucket for user1
    const bucketData = generateTestData();
    const { data: bucket, error: bucketError } = await serviceClient
      .from("buckets")
      .insert({
        owner: TEST_USERS.user1.id,
        name: bucketData.title,
        max_size: 100 * 1024 * 1024,
        type: "small",
        users_count: 1,
      })
      .select()
      .single();

    if (bucketError) throw bucketError;

    testBucketId = bucket.id;

    // Add the owner as a bucket user
    const { error: bucketUserError } = await serviceClient
      .from("bucket_users")
      .insert({
        bucket_id: testBucketId,
        user_id: TEST_USERS.user1.id,
      });

    if (bucketUserError) throw bucketUserError;

    // Create a test course in the bucket
    const courseData = generateTestData();
    const { data: course, error: courseError } = await serviceClient
      .from("courses")
      .insert({
        name: courseData.title,
        bucket_id: testBucketId,
        description: "Test course for file deletion tests",
      })
      .select()
      .single();

    if (courseError) throw courseError;

    testCourseId = course.id;

    // Create test files in the course
    fileSize = 1024 * 1024;
    const fileData = generateTestData();
    const { data: file, error: fileError } = await serviceClient
      .from("files")
      .insert({
        name: fileData.title,
        course_id: testCourseId,
        size: fileSize,
      })
      .select()
      .single();

    if (fileError) throw fileError;

    testFileId = file.id;

    // Create a second test file
    file2Size = 2 * 1024 * 1024;
    const file2Data = generateTestData();
    const { data: file2, error: file2Error } = await serviceClient
      .from("files")
      .insert({
        name: file2Data.title,
        course_id: testCourseId,
        size: file2Size,
      })
      .select()
      .single();

    if (file2Error) throw file2Error;

    testFile2Id = file2.id;

    // Update bucket size to reflect the added files
    const totalSize = fileSize + file2Size;
    const { error: updateError } = await serviceClient
      .from("buckets")
      .update({ size: totalSize })
      .eq("id", testBucketId);

    if (updateError) throw updateError;
  });

  afterAll(async () => {
    // Clean up remaining test file if it exists
    await serviceClient.from("files").delete().eq("id", testFile2Id);

    // Clean up the test course
    if (testCourseId) {
      await serviceClient.from("courses").delete().eq("id", testCourseId);
    }

    // Clean up the test bucket if it exists
    if (testBucketId) {
      await serviceClient.from("buckets").delete().eq("id", testBucketId);
    }
  });

  it("should allow service account to delete a file and update bucket size", async () => {
    // Get current bucket size before deletion
    const { data: bucketBefore, error: bucketBeforeError } = await serviceClient
      .from("buckets")
      .select("size")
      .eq("id", testBucketId)
      .single();

    if (bucketBeforeError) throw bucketBeforeError;

    // Delete the file and update bucket size
    const { error } = await serviceClient.rpc(
      "delete_file_and_update_bucket_size",
      {
        p_file_id: testFileId,
        p_bucket_id: testBucketId,
      }
    );

    if (error) throw error;

    // Verify the file is deleted
    const { data: fileAfter, error: fileAfterError } = await serviceClient
      .from("files")
      .select()
      .eq("id", testFileId);

    if (fileAfterError) throw fileAfterError;

    expect(fileAfter.length).toBe(0);

    // Verify bucket size has been updated
    const { data: bucketAfter, error: bucketAfterError } = await serviceClient
      .from("buckets")
      .select("size")
      .eq("id", testBucketId)
      .single();

    if (bucketAfterError) throw bucketAfterError;

    expect(bucketAfter.size).toBe(bucketBefore.size - fileSize);
  });

  it("should not allow regular users to call the function, only service account", async () => {
    // User1 should not be able to call the function, even though they own the file
    const { error } = await user1Client.rpc(
      "delete_file_and_update_bucket_size",
      {
        p_file_id: testFile2Id,
        p_bucket_id: testBucketId,
      }
    );

    expect(error).not.toBeNull();
    expect(error?.message).toContain("File not found");

    // Verify file still exists
    const { data: fileAfter, error: fileAfterError } = await serviceClient
      .from("files")
      .select()
      .eq("id", testFile2Id);

    if (fileAfterError) throw fileAfterError;

    expect(fileAfter.length).toBe(1);
  });

  it("should not allow unauthorized users to delete files", async () => {
    // User2 should not be able to delete User1's file
    const { error } = await user2Client.rpc(
      "delete_file_and_update_bucket_size",
      {
        p_file_id: testFile2Id,
        p_bucket_id: testBucketId,
      }
    );

    expect(error).not.toBeNull();

    // Verify file still exists
    const { data: fileAfter, error: fileAfterError } = await serviceClient
      .from("files")
      .select()
      .eq("id", testFile2Id);

    if (fileAfterError) throw fileAfterError;

    expect(fileAfter.length).toBe(1);
  });

  it("should not allow unauthenticated access", async () => {
    const { error } = await anonymousClient.rpc(
      "delete_file_and_update_bucket_size",
      {
        p_file_id: testFile2Id,
        p_bucket_id: testBucketId,
      }
    );

    expect(error).not.toBeNull();

    // Verify file still exists
    const { data: fileAfter, error: fileAfterError } = await serviceClient
      .from("files")
      .select()
      .eq("id", testFile2Id);

    if (fileAfterError) throw fileAfterError;

    expect(fileAfter.length).toBe(1);
  });

  it("should handle errors for non-existent files", async () => {
    const nonExistentFileId = "00000000-0000-0000-0000-000000000000";

    const { error } = await serviceClient.rpc(
      "delete_file_and_update_bucket_size",
      {
        p_file_id: nonExistentFileId,
        p_bucket_id: testBucketId,
      }
    );

    expect(error).not.toBeNull();
    expect(error?.message).toContain("File not found");
  });

  it("should handle errors for non-existent buckets", async () => {
    const nonExistentBucketId = "00000000-0000-0000-0000-000000000000";

    const { error } = await serviceClient.rpc(
      "delete_file_and_update_bucket_size",
      {
        p_file_id: testFile2Id,
        p_bucket_id: nonExistentBucketId,
      }
    );

    expect(error).not.toBeNull();

    // Verify file still exists
    const { data: fileAfter, error: fileAfterError } = await serviceClient
      .from("files")
      .select()
      .eq("id", testFile2Id);

    if (fileAfterError) throw fileAfterError;

    expect(fileAfter.length).toBe(1);
  });
});
