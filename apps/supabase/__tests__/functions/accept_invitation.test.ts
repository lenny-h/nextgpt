import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("accept_invitation function", () => {
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testBucketId: string;
  let testCourseId: string;

  beforeAll(async () => {
    user2Client = await signInUser(
      TEST_USERS.user2.email,
      TEST_USERS.user2.password
    );
    anonymousClient = createUnauthenticatedClient();
    serviceClient = createServiceClient();

    // Create a test bucket owned by user1
    const testData = generateTestData();
    const { data: bucketData, error: bucketError } = await serviceClient
      .from("buckets")
      .insert({
        name: testData.title,
        owner: TEST_USERS.user1.id,
        max_size: 2 * 1024 * 1024 * 1024,
        type: "small",
      })
      .select()
      .single();

    if (bucketError) throw bucketError;
    if (!bucketData) throw new Error("Test bucket not created.");
    testBucketId = bucketData.id;

    // Create a test course in the bucket
    const { data: courseData, error: courseError } = await serviceClient
      .from("courses")
      .insert({
        name: `${testData.title} Course`,
        bucket_id: testBucketId,
        description: "Test course for maintainer invitation",
      })
      .select()
      .single();

    if (courseError) throw courseError;
    if (!courseData) throw new Error("Test course not created.");
    testCourseId = courseData.id;
  });

  afterAll(async () => {
    // Clean up all test data
    await serviceClient
      .from("user_invitations")
      .delete()
      .eq("target", TEST_USERS.user2.id);
    await serviceClient
      .from("course_maintainer_invitations")
      .delete()
      .eq("target", TEST_USERS.user2.id);
    await serviceClient
      .from("bucket_maintainer_invitations")
      .delete()
      .eq("target", TEST_USERS.user2.id);
    await serviceClient
      .from("bucket_users")
      .delete()
      .eq("user_id", TEST_USERS.user2.id);
    await serviceClient
      .from("course_maintainers")
      .delete()
      .eq("user_id", TEST_USERS.user2.id);
    await serviceClient
      .from("bucket_maintainers")
      .delete()
      .eq("user_id", TEST_USERS.user2.id);
    await serviceClient.from("courses").delete().eq("id", testCourseId);
    await serviceClient.from("buckets").delete().eq("id", testBucketId);
  });

  describe("user invitation", () => {
    beforeAll(async () => {
      // Create a test invitation from user1 to user2
      const { error: invitationError } = await serviceClient
        .from("user_invitations")
        .insert({
          origin: TEST_USERS.user1.id,
          target: TEST_USERS.user2.id,
          bucket_id: testBucketId,
          bucket_name: "Test Bucket",
        });
      if (invitationError) throw invitationError;
    });

    it("should allow a service client to accept a user invitation", async () => {
      const { error: acceptError } = await serviceClient.rpc(
        "accept_invitation",
        {
          p_invitation_type: "user",
          p_origin_user_id: TEST_USERS.user1.id,
          p_target_user_id: TEST_USERS.user2.id,
          p_resource_id: testBucketId,
        }
      );

      expect(acceptError).toBeNull();

      const { data: bucketUsers, error: fetchError } = await serviceClient
        .from("bucket_users")
        .select()
        .eq("bucket_id", testBucketId)
        .eq("user_id", TEST_USERS.user2.id);
      expect(fetchError).toBeNull();
      expect(bucketUsers).not.toBeNull();
      expect(bucketUsers!.length).toBe(1);

      const { data: invitation, error: invitationError } = await serviceClient
        .from("user_invitations")
        .select()
        .eq("origin", TEST_USERS.user1.id)
        .eq("target", TEST_USERS.user2.id)
        .eq("bucket_id", testBucketId);
      expect(invitationError).toBeNull();
      expect(invitation).not.toBeNull();
      expect(invitation!.length).toBe(0);
    });

    it("should not allow an authenticated user to accept a user invitation", async () => {
      const { error } = await user2Client.rpc("accept_invitation", {
        p_invitation_type: "user",
        p_origin_user_id: TEST_USERS.user1.id,
        p_target_user_id: TEST_USERS.user2.id,
        p_resource_id: testBucketId,
      });
      expect(error).not.toBeNull();
    });

    it("should not allow an unauthenticated user to accept a user invitation", async () => {
      const { error } = await anonymousClient.rpc("accept_invitation", {
        p_invitation_type: "user",
        p_origin_user_id: TEST_USERS.user1.id,
        p_target_user_id: TEST_USERS.user2.id,
        p_resource_id: testBucketId,
      });
      expect(error).not.toBeNull();
    });
  });

  describe("course maintainer invitation", () => {
    beforeAll(async () => {
      const { error: invitationError } = await serviceClient
        .from("course_maintainer_invitations")
        .insert({
          origin: TEST_USERS.user1.id,
          target: TEST_USERS.user2.id,
          course_id: testCourseId,
          course_name: "Test Course",
        });
      if (invitationError) throw invitationError;
    });

    it("should allow a service client to accept a course maintainer invitation", async () => {
      const { error: acceptError } = await serviceClient.rpc(
        "accept_invitation",
        {
          p_invitation_type: "course_maintainer",
          p_origin_user_id: TEST_USERS.user1.id,
          p_target_user_id: TEST_USERS.user2.id,
          p_resource_id: testCourseId,
        }
      );
      expect(acceptError).toBeNull();

      const { data, error } = await serviceClient
        .from("course_maintainers")
        .select()
        .eq("course_id", testCourseId)
        .eq("user_id", TEST_USERS.user2.id);
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.length).toBe(1);

      const { data: invitation } = await serviceClient
        .from("course_maintainer_invitations")
        .select()
        .eq("course_id", testCourseId);
      expect(invitation).not.toBeNull();
      expect(invitation!.length).toBe(0);
    });

    it("should not allow an authenticated user to accept a course maintainer invitation", async () => {
      const { error } = await user2Client.rpc("accept_invitation", {
        p_invitation_type: "course_maintainer",
        p_origin_user_id: TEST_USERS.user1.id,
        p_target_user_id: TEST_USERS.user2.id,
        p_resource_id: testCourseId,
      });
      expect(error).not.toBeNull();
    });

    it("should not allow an unauthenticated user to accept a course maintainer invitation", async () => {
      const { error } = await anonymousClient.rpc("accept_invitation", {
        p_invitation_type: "course_maintainer",
        p_origin_user_id: TEST_USERS.user1.id,
        p_target_user_id: TEST_USERS.user2.id,
        p_resource_id: testCourseId,
      });
      expect(error).not.toBeNull();
    });
  });

  describe("bucket maintainer invitation", () => {
    beforeAll(async () => {
      const { error: invitationError } = await serviceClient
        .from("bucket_maintainer_invitations")
        .insert({
          origin: TEST_USERS.user1.id,
          target: TEST_USERS.user2.id,
          bucket_id: testBucketId,
          bucket_name: "Test Bucket",
        });
      if (invitationError) throw invitationError;
    });

    it("should allow a service client to accept a bucket maintainer invitation", async () => {
      const { error: acceptError } = await serviceClient.rpc(
        "accept_invitation",
        {
          p_invitation_type: "bucket_maintainer",
          p_origin_user_id: TEST_USERS.user1.id,
          p_target_user_id: TEST_USERS.user2.id,
          p_resource_id: testBucketId,
        }
      );
      expect(acceptError).toBeNull();

      const { data, error } = await serviceClient
        .from("bucket_maintainers")
        .select()
        .eq("bucket_id", testBucketId)
        .eq("user_id", TEST_USERS.user2.id);
      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.length).toBe(1);

      const { data: invitation } = await serviceClient
        .from("bucket_maintainer_invitations")
        .select()
        .eq("bucket_id", testBucketId);
      expect(invitation).not.toBeNull();
      expect(invitation!.length).toBe(0);
    });

    it("should not allow an authenticated user to accept a bucket maintainer invitation", async () => {
      const { error } = await user2Client.rpc("accept_invitation", {
        p_invitation_type: "bucket_maintainer",
        p_origin_user_id: TEST_USERS.user1.id,
        p_target_user_id: TEST_USERS.user2.id,
        p_resource_id: testBucketId,
      });
      expect(error).not.toBeNull();
    });

    it("should not allow an unauthenticated user to accept a bucket maintainer invitation", async () => {
      const { error } = await anonymousClient.rpc("accept_invitation", {
        p_invitation_type: "bucket_maintainer",
        p_origin_user_id: TEST_USERS.user1.id,
        p_target_user_id: TEST_USERS.user2.id,
        p_resource_id: testBucketId,
      });
      expect(error).not.toBeNull();
    });
  });
});
