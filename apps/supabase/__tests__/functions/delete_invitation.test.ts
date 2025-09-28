import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("delete_invitation function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testBucketId: string;
  let testCourseId: string;
  const testData = generateTestData();

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

    const { data: bucket, error: bucketError } = await serviceClient
      .from("buckets")
      .insert({
        owner: TEST_USERS.user1.id,
        name: testData.title,
        max_size: 100 * 1024 * 1024,
        type: "small",
        users_count: 1,
      })
      .select()
      .single();
    if (bucketError) throw bucketError;
    testBucketId = bucket.id;

    const { data: course, error: courseError } = await serviceClient
      .from("courses")
      .insert({
        name: testData.title,
        bucket_id: testBucketId,
        description: "Test course description",
      })
      .select()
      .single();
    if (courseError) throw courseError;
    testCourseId = course.id;
  });

  afterAll(async () => {
    await serviceClient
      .from("user_invitations")
      .delete()
      .eq("bucket_id", testBucketId);
    await serviceClient
      .from("course_maintainer_invitations")
      .delete()
      .eq("course_id", testCourseId);
    await serviceClient
      .from("bucket_maintainer_invitations")
      .delete()
      .eq("bucket_id", testBucketId);
    await serviceClient.from("courses").delete().eq("id", testCourseId);
    await serviceClient
      .from("bucket_users")
      .delete()
      .eq("bucket_id", testBucketId);
    await serviceClient.from("buckets").delete().eq("id", testBucketId);
  });

  describe("user invitations", () => {
    beforeAll(async () => {
      const { error } = await serviceClient.from("user_invitations").insert({
        origin: TEST_USERS.user1.id,
        target: TEST_USERS.user2.id,
        bucket_id: testBucketId,
        bucket_name: testData.title,
      });
      if (error) throw error;
    });

    it("should allow creator to delete", async () => {
      const { error } = await user1Client.rpc("delete_invitation", {
        p_invitation_type: "user",
        p_origin: TEST_USERS.user1.id,
        p_target: TEST_USERS.user2.id,
        p_resource_id: testBucketId,
      });
      expect(error).toBeNull();
    });

    it("should allow target to delete", async () => {
      // Re-create invitation
      await serviceClient.from("user_invitations").insert({
        origin: TEST_USERS.user1.id,
        target: TEST_USERS.user2.id,
        bucket_id: testBucketId,
        bucket_name: testData.title,
      });
      const { error } = await user2Client.rpc("delete_invitation", {
        p_invitation_type: "user",
        p_origin: TEST_USERS.user1.id,
        p_target: TEST_USERS.user2.id,
        p_resource_id: testBucketId,
      });
      expect(error).toBeNull();
    });
  });

  describe("course maintainer invitations", () => {
    beforeAll(async () => {
      const { error } = await serviceClient
        .from("course_maintainer_invitations")
        .insert({
          origin: TEST_USERS.user1.id,
          target: TEST_USERS.user2.id,
          course_id: testCourseId,
          course_name: testData.title,
        });
      if (error) throw error;
    });

    it("should allow creator to delete", async () => {
      const { error } = await user1Client.rpc("delete_invitation", {
        p_invitation_type: "course_maintainer",
        p_origin: TEST_USERS.user1.id,
        p_target: TEST_USERS.user2.id,
        p_resource_id: testCourseId,
      });
      expect(error).toBeNull();
    });

    it("should allow target to delete", async () => {
      await serviceClient.from("course_maintainer_invitations").insert({
        origin: TEST_USERS.user1.id,
        target: TEST_USERS.user2.id,
        course_id: testCourseId,
        course_name: testData.title,
      });
      const { error } = await user2Client.rpc("delete_invitation", {
        p_invitation_type: "course_maintainer",
        p_origin: TEST_USERS.user1.id,
        p_target: TEST_USERS.user2.id,
        p_resource_id: testCourseId,
      });
      expect(error).toBeNull();
    });
  });

  describe("bucket maintainer invitations", () => {
    beforeAll(async () => {
      const { error } = await serviceClient
        .from("bucket_maintainer_invitations")
        .insert({
          origin: TEST_USERS.user1.id,
          target: TEST_USERS.user2.id,
          bucket_id: testBucketId,
          bucket_name: testData.title,
        });
      if (error) throw error;
    });

    it("should allow creator to delete", async () => {
      const { error } = await user1Client.rpc("delete_invitation", {
        p_invitation_type: "bucket_maintainer",
        p_origin: TEST_USERS.user1.id,
        p_target: TEST_USERS.user2.id,
        p_resource_id: testBucketId,
      });
      expect(error).toBeNull();
    });

    it("should allow target to delete", async () => {
      await serviceClient.from("bucket_maintainer_invitations").insert({
        origin: TEST_USERS.user1.id,
        target: TEST_USERS.user2.id,
        bucket_id: testBucketId,
        bucket_name: testData.title,
      });
      const { error } = await user2Client.rpc("delete_invitation", {
        p_invitation_type: "bucket_maintainer",
        p_origin: TEST_USERS.user1.id,
        p_target: TEST_USERS.user2.id,
        p_resource_id: testBucketId,
      });
      expect(error).toBeNull();
    });
  });

  it("should not delete invitation for unauthenticated user", async () => {
    await serviceClient.from("user_invitations").insert({
      origin: TEST_USERS.user1.id,
      target: TEST_USERS.user2.id,
      bucket_id: testBucketId,
      bucket_name: testData.title,
    });
    const { error } = await anonymousClient.rpc("delete_invitation", {
      p_invitation_type: "user",
      p_origin: TEST_USERS.user1.id,
      p_target: TEST_USERS.user2.id,
      p_resource_id: testBucketId,
    });
    expect(error).toBeNull();

    // Check that invitation still exists
    const { data: invitation, error: selectError } = await serviceClient
      .from("user_invitations")
      .select()
      .eq("origin", TEST_USERS.user1.id)
      .eq("target", TEST_USERS.user2.id)
      .eq("bucket_id", testBucketId)
      .single();
    expect(selectError).toBeNull();
    expect(invitation).not.toBeNull();
  });
});
