import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("create_course function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testBucketId: string;
  let testCourseId: string;

  beforeAll(async () => {
    user1Client = await signInUser(
      TEST_USERS.user1.email,
      TEST_USERS.user1.password
    );
    anonymousClient = createUnauthenticatedClient();
    serviceClient = createServiceClient();

    // Create a test bucket first
    const testData = generateTestData();
    const { data, error } = await serviceClient.rpc("create_bucket", {
      p_owner: TEST_USERS.user1.id,
      p_name: testData.title,
      p_type: "small",
      p_max_size: 2 * 1024 * 1024 * 1024,
    });

    if (error) throw error;
    testBucketId = data;
  });

  afterAll(async () => {
    // Clean up test courses
    if (testCourseId) {
      await serviceClient
        .from("course_keys")
        .delete()
        .eq("course_id", testCourseId);
      await serviceClient
        .from("course_maintainers")
        .delete()
        .eq("course_id", testCourseId);
      await serviceClient.from("courses").delete().eq("id", testCourseId);
    }

    // Clean up test bucket
    if (testBucketId) {
      await serviceClient
        .from("bucket_users")
        .delete()
        .eq("bucket_id", testBucketId);
      await serviceClient.from("buckets").delete().eq("id", testBucketId);
    }
  });

  it("should allow a service client to create a course and set a maintainer", async () => {
    const testData = generateTestData();
    const courseName = testData.title;
    const courseDescription = "Test course description";

    // Service client creates a course
    const { data, error } = await serviceClient.rpc("create_course", {
      p_name: courseName,
      p_description: courseDescription,
      p_bucket_id: testBucketId,
      p_user_id: TEST_USERS.user1.id,
    });

    if (error) throw error;

    testCourseId = data;

    // Verify course was created
    const { data: courseData, error: courseError } = await serviceClient
      .from("courses")
      .select()
      .eq("id", testCourseId)
      .single();

    if (courseError) throw courseError;

    expect(courseData.name).toBe(courseName);
    expect(courseData.description).toBe(courseDescription);
    expect(courseData.bucket_id).toBe(testBucketId);

    // Verify maintainer association
    const { data: maintainerData, error: maintainerError } = await serviceClient
      .from("course_maintainers")
      .select()
      .eq("course_id", testCourseId)
      .eq("user_id", TEST_USERS.user1.id);

    if (maintainerError) throw maintainerError;

    expect(maintainerData.length).toBe(1);
  });

  it("should not allow a regular user to create a course", async () => {
    const testData = generateTestData();
    const courseName = testData.title;

    // User1 tries to create a course but should get an error
    const { data, error } = await user1Client.rpc("create_course", {
      p_name: courseName,
      p_description: "Test course description",
      p_bucket_id: testBucketId,
      p_user_id: TEST_USERS.user1.id,
    });

    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("should not allow an unauthenticated user to create a course", async () => {
    const testData = generateTestData();
    const courseName = testData.title;

    // Anonymous user tries to create a course
    const { error } = await anonymousClient.rpc("create_course", {
      p_name: courseName,
      p_description: "Test course description",
      p_bucket_id: testBucketId,
      p_user_id: TEST_USERS.user1.id,
    });

    expect(error).not.toBeNull();
  });

  it("should allow creating a course with an encrypted key", async () => {
    const testData = generateTestData();
    const courseName = testData.title;
    const courseDescription = "Test course description";
    const encryptedKey = "encrypted_password_hash_123456789";

    // Service client creates a course with encrypted key
    const { data, error } = await serviceClient.rpc("create_course", {
      p_name: courseName,
      p_description: courseDescription,
      p_bucket_id: testBucketId,
      p_user_id: TEST_USERS.user1.id,
      p_encrypted_key: encryptedKey,
    });

    if (error) throw error;

    const courseId = data;

    // Verify course was created
    const { data: courseData, error: courseError } = await serviceClient
      .from("courses")
      .select()
      .eq("id", courseId)
      .single();

    if (courseError) throw courseError;

    expect(courseData.name).toBe(courseName);
    expect(courseData.private).toBe(true);

    // Verify encrypted key was stored
    const { data: keyData, error: keyError } = await serviceClient
      .from("course_keys")
      .select()
      .eq("course_id", courseId)
      .single();

    if (keyError) throw keyError;

    expect(keyData.key).toBe(encryptedKey);

    // Clean up this specific test course
    await serviceClient.from("course_keys").delete().eq("course_id", courseId);
    await serviceClient
      .from("course_maintainers")
      .delete()
      .eq("course_id", courseId);
    await serviceClient.from("courses").delete().eq("id", courseId);
  });

  it("should allow creating a course without an encrypted key", async () => {
    const testData = generateTestData();
    const courseName = testData.title;
    const courseDescription = "Test course description";

    // Service client creates a course without encrypted key
    const { data, error } = await serviceClient.rpc("create_course", {
      p_name: courseName,
      p_description: courseDescription,
      p_bucket_id: testBucketId,
      p_user_id: TEST_USERS.user1.id,
    });

    if (error) throw error;

    const courseId = data;

    // Verify no key was stored
    const { data: keyData, error: keyError } = await serviceClient
      .from("course_keys")
      .select()
      .eq("course_id", courseId);

    if (keyError) throw keyError;

    expect(keyData.length).toBe(0);

    // Clean up this specific test course
    await serviceClient
      .from("course_maintainers")
      .delete()
      .eq("course_id", courseId);
    await serviceClient.from("courses").delete().eq("id", courseId);
  });
});
