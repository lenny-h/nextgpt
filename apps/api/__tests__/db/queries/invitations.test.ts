import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  acceptCourseMaintainerInvitation,
  acceptUserInvitation,
  deleteUserInvitation,
} from "../../../src/lib/db/queries/invitations.js";
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

describe("invitations.ts query tests", async () => {
  const testUserInvitations: {
    origin: string;
    target: string;
    bucket_id: string;
  }[] = [];
  const testMaintainerInvitations: {
    origin: string;
    target: string;
    course_id: string;
  }[] = [];
  const testCourseMaintainerInvitations: {
    origin: string;
    target: string;
    course_id: string;
  }[] = [];
  const testBucketUsers: { bucket_id: string; user_id: string }[] = [];
  const testCourseMaintainers: { course_id: string; user_id: string }[] = [];
  const testBuckets: { id: string }[] = [];
  const testCourses: { id: string }[] = [];

  const testUserId1 = TEST_USERS.user1.id;
  const testUserId2 = TEST_USERS.user2.id;
  let testBucketId: string;
  let testCourseId: string;

  const supabase = createServiceClient();

  beforeAll(async () => {
    // Create a test bucket
    const bucketData = generateTestData();
    testBucketId = bucketData.uuid;

    const { error: bucketError } = await supabase
      .from("buckets")
      .insert({
        id: testBucketId,
        owner: testUserId1,
        name: bucketData.title,
        max_size: 1024 * 1024 * 1024, // 1GB
        type: "small",
      })
      .select()
      .single();

    if (bucketError) throw bucketError;

    testBuckets.push({ id: testBucketId });

    // Create a test course
    const courseData = generateTestData();
    testCourseId = courseData.uuid;

    const { error: courseError } = await supabase
      .from("courses")
      .insert({
        id: testCourseId,
        bucket_id: testBucketId,
        name: courseData.title,
      })
      .select()
      .single();

    if (courseError) throw courseError;

    testCourses.push({ id: testCourseId });
  });

  // Clear any existing invitations before each test
  beforeEach(async () => {
    // Clean up any existing invitations for the test users
    await supabase
      .from("user_invitations")
      .delete()
      .eq("origin", testUserId1)
      .eq("target", testUserId2);

    await supabase
      .from("course_maintainer_invitations")
      .delete()
      .eq("origin", testUserId1)
      .eq("target", testUserId2);
  });

  afterAll(async () => {
    // Clean up test data
    for (const invitation of testUserInvitations) {
      await supabase
        .from("user_invitations")
        .delete()
        .eq("origin", invitation.origin)
        .eq("target", invitation.target)
        .eq("bucket_id", invitation.bucket_id);
    }

    for (const invitation of testMaintainerInvitations) {
      await supabase
        .from("course_maintainer_invitations")
        .delete()
        .eq("origin", invitation.origin)
        .eq("target", invitation.target)
        .eq("course_id", invitation.course_id);
    }

    for (const invitation of testCourseMaintainerInvitations) {
      await supabase
        .from("course_maintainer_invitations")
        .delete()
        .eq("origin", invitation.origin)
        .eq("target", invitation.target)
        .eq("course_id", invitation.course_id);
    }

    for (const bucketUser of testBucketUsers) {
      await supabase
        .from("bucket_users")
        .delete()
        .eq("bucket_id", bucketUser.bucket_id)
        .eq("user_id", bucketUser.user_id);
    }

    for (const courseMaintainer of testCourseMaintainers) {
      await supabase
        .from("course_maintainers")
        .delete()
        .eq("course_id", courseMaintainer.course_id)
        .eq("user_id", courseMaintainer.user_id);
    }

    for (const course of testCourses) {
      await cleanupTestData(supabase, "courses", "id", course.id);
    }

    for (const bucket of testBuckets) {
      await cleanupTestData(supabase, "buckets", "id", bucket.id);
    }
  });

  it("should create, accept, and delete user invitation", async () => {
    // Arrange - Create user invitation
    const { error: invitationError } = await supabase
      .from("user_invitations")
      .insert({
        origin: testUserId1,
        target: testUserId2,
        bucket_id: testBucketId,
        bucket_name: "Test Bucket",
      });

    if (invitationError) throw invitationError;

    testUserInvitations.push({
      origin: testUserId1,
      target: testUserId2,
      bucket_id: testBucketId,
    });

    // Act - Accept the invitation
    await acceptUserInvitation({
      originUserId: testUserId1,
      targetUserId: testUserId2,
      bucketId: testBucketId,
    });

    // Check if the user was added to the bucket
    const { data: bucketUsers, error: bucketUsersError } = await supabase
      .from("bucket_users")
      .select()
      .eq("bucket_id", testBucketId)
      .eq("user_id", testUserId2);

    if (bucketUsersError) throw bucketUsersError;

    expect(bucketUsers.length).toBe(1);

    testBucketUsers.push({
      bucket_id: testBucketId,
      user_id: testUserId2,
    });

    // Check if the invitation was deleted
    const { data: remainingInvitations, error: remainingError } = await supabase
      .from("user_invitations")
      .select()
      .eq("origin", testUserId1)
      .eq("target", testUserId2)
      .eq("bucket_id", testBucketId);

    if (remainingError) throw remainingError;

    expect(remainingInvitations.length).toBe(0);
  });

  it("should create and delete invitation without accepting", async () => {
    // Arrange - Create user invitation
    const { error: invitationError } = await supabase
      .from("user_invitations")
      .insert({
        origin: testUserId1,
        target: testUserId2,
        bucket_id: testBucketId,
        bucket_name: "Test Bucket",
      });

    if (invitationError) throw invitationError;

    testUserInvitations.push({
      origin: testUserId1,
      target: testUserId2,
      bucket_id: testBucketId,
    });

    // Act - Delete the invitation
    const result = await deleteUserInvitation({
      originUserId: testUserId1,
      targetUserId: testUserId2,
      bucketId: testBucketId,
    });

    // Assert
    expect(result.success).toBe(true);

    // Check if the invitation was deleted
    const { data: remainingInvitations, error: remainingError } = await supabase
      .from("user_invitations")
      .select()
      .eq("origin", testUserId1)
      .eq("target", testUserId2)
      .eq("bucket_id", testBucketId);

    if (remainingError) throw remainingError;

    expect(remainingInvitations.length).toBe(0);
  });

  it("should create and accept maintainer invitation", async () => {
    // Arrange - Create maintainer invitation
    const { error: invitationError } = await supabase
      .from("course_maintainer_invitations")
      .insert({
        origin: testUserId1,
        target: testUserId2,
        course_id: testCourseId,
        course_name: "Test Course",
      });

    if (invitationError) {
      throw invitationError;
    }

    testCourseMaintainerInvitations.push({
      origin: testUserId1,
      target: testUserId2,
      course_id: testCourseId,
    });

    // Act - Accept the invitation
    await acceptCourseMaintainerInvitation({
      originUserId: testUserId1,
      targetUserId: testUserId2,
      courseId: testCourseId,
    });

    // Check if the user was added as a course maintainer
    const { data: courseMaintainers, error: maintainersError } = await supabase
      .from("course_maintainers")
      .select()
      .eq("course_id", testCourseId)
      .eq("user_id", testUserId2);

    if (maintainersError) {
      throw maintainersError;
    }

    expect(courseMaintainers.length).toBe(1);

    testCourseMaintainers.push({
      course_id: testCourseId,
      user_id: testUserId2,
    });

    // Check if the invitation was deleted
    const { data: remainingInvitations, error: remainingError } = await supabase
      .from("course_maintainer_invitations")
      .select()
      .eq("origin", testUserId1)
      .eq("target", testUserId2)
      .eq("course_id", testCourseId);

    if (remainingError) {
      throw remainingError;
    }

    expect(remainingInvitations.length).toBe(0);
  });
});
