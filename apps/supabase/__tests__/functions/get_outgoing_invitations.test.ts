import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("get_outgoing_invitations function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testBucketId: string;
  let testCourseId: string;
  let userInvitations: any[] = [];
  let courseMaintainerInvitations: any[] = [];
  let bucketMaintainerInvitations: any[] = [];
  let createdBuckets: string[] = [];
  let createdCourses: string[] = [];

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

    // Create a test bucket owned by user1
    const testData = generateTestData();
    const bucketName = testData.title;
    const { data: bucketData, error: bucketError } = await serviceClient
      .from("buckets")
      .insert({
        name: bucketName,
        owner: TEST_USERS.user1.id,
        max_size: 1024 * 1024,
        type: "large",
      })
      .select()
      .single();

    if (bucketError) throw bucketError;
    testBucketId = bucketData.id;
    createdBuckets.push(testBucketId);

    // Create a test user invitation from user1 to user2
    const { data: userInvitation1, error: userInvitationError1 } =
      await serviceClient
        .from("user_invitations")
        .insert({
          origin: TEST_USERS.user1.id,
          target: TEST_USERS.user2.id,
          bucket_id: testBucketId,
          bucket_name: bucketName,
        })
        .select()
        .single();

    if (userInvitationError1) throw userInvitationError1;
    userInvitations.push(userInvitation1);

    // Create a test course in the bucket
    const courseName = `Test Course ${Math.random().toString(36).substring(7)}`;
    const { data: courseData, error: courseError } = await serviceClient
      .from("courses")
      .insert({
        name: courseName,
        bucket_id: testBucketId,
        description: "Test course description",
      })
      .select()
      .single();

    if (courseError) throw courseError;
    testCourseId = courseData.id;
    createdCourses.push(testCourseId);

    // Add user1 as a course maintainer
    await serviceClient.from("course_maintainers").insert({
      course_id: testCourseId,
      user_id: TEST_USERS.user1.id,
    });

    // Create a test course maintainer invitation from user1 to user2
    const { data: courseInvitation1, error: courseInvitationError1 } =
      await serviceClient
        .from("course_maintainer_invitations")
        .insert({
          origin: TEST_USERS.user1.id,
          target: TEST_USERS.user2.id,
          course_id: testCourseId,
          course_name: courseName,
        })
        .select()
        .single();

    if (courseInvitationError1) throw courseInvitationError1;
    courseMaintainerInvitations.push(courseInvitation1);

    // Add user1 as a bucket maintainer
    await serviceClient.from("bucket_maintainers").insert({
      bucket_id: testBucketId,
      user_id: TEST_USERS.user1.id,
    });

    // Create a test bucket maintainer invitation from user1 to user2
    const { data: bucketInvitation1, error: bucketInvitationError1 } =
      await serviceClient
        .from("bucket_maintainer_invitations")
        .insert({
          origin: TEST_USERS.user1.id,
          target: TEST_USERS.user2.id,
          bucket_id: testBucketId,
          bucket_name: bucketName,
        })
        .select()
        .single();

    if (bucketInvitationError1) throw bucketInvitationError1;
    bucketMaintainerInvitations.push(bucketInvitation1);
  });

  afterAll(async () => {
    // Clean up invitations first (they reference other tables)
    for (const inv of userInvitations) {
      try {
        await serviceClient.from("user_invitations").delete().match({
          origin: inv.origin,
          target: inv.target,
          bucket_id: inv.bucket_id,
        });
      } catch (error) {
        console.warn("Failed to delete user invitation:", error);
      }
    }
    for (const inv of courseMaintainerInvitations) {
      try {
        await serviceClient
          .from("course_maintainer_invitations")
          .delete()
          .match({
            origin: inv.origin,
            target: inv.target,
            course_id: inv.course_id,
          });
      } catch (error) {
        console.warn("Failed to delete course maintainer invitation:", error);
      }
    }
    for (const inv of bucketMaintainerInvitations) {
      try {
        await serviceClient
          .from("bucket_maintainer_invitations")
          .delete()
          .match({
            origin: inv.origin,
            target: inv.target,
            bucket_id: inv.bucket_id,
          });
      } catch (error) {
        console.warn("Failed to delete bucket maintainer invitation:", error);
      }
    }

    // Clean up maintainers (they reference courses/buckets)
    for (const courseId of createdCourses) {
      try {
        await serviceClient
          .from("course_maintainers")
          .delete()
          .eq("course_id", courseId);
      } catch (error) {
        console.warn("Failed to delete course maintainers:", error);
      }
    }

    for (const bucketId of createdBuckets) {
      try {
        await serviceClient
          .from("bucket_maintainers")
          .delete()
          .eq("bucket_id", bucketId);
      } catch (error) {
        console.warn("Failed to delete bucket maintainers:", error);
      }
    }

    // Clean up courses (they reference buckets)
    for (const courseId of createdCourses) {
      try {
        await serviceClient.from("courses").delete().eq("id", courseId);
      } catch (error) {
        console.warn("Failed to delete course:", error);
      }
    }

    // Clean up buckets last
    for (const bucketId of createdBuckets) {
      try {
        await serviceClient.from("buckets").delete().eq("id", bucketId);
      } catch (error) {
        console.warn("Failed to delete bucket:", error);
      }
    }

    // Reset arrays
    userInvitations = [];
    courseMaintainerInvitations = [];
    bucketMaintainerInvitations = [];
    createdBuckets = [];
    createdCourses = [];
  });

  it("should retrieve outgoing user invitations", async () => {
    const { data, error } = await user1Client.rpc("get_outgoing_invitations", {
      invitation_type: "user",
    });
    if (error) throw error;
    expect(data.length).toBeGreaterThanOrEqual(1);
    const inv = data.find((i: any) => i.resource_id === testBucketId);
    expect(inv).toBeDefined();
    expect(inv!.origin).toBe(TEST_USERS.user1.id);
    expect(inv!.target).toBe(TEST_USERS.user2.id);
    expect(inv!.target_username).toBe(TEST_USERS.user2.username);
  });

  it("should retrieve outgoing course maintainer invitations", async () => {
    const { data, error } = await user1Client.rpc("get_outgoing_invitations", {
      invitation_type: "course_maintainer",
    });
    if (error) throw error;
    expect(data.length).toBeGreaterThanOrEqual(1);
    const inv = data.find((i: any) => i.resource_id === testCourseId);
    expect(inv).toBeDefined();
    expect(inv!.origin).toBe(TEST_USERS.user1.id);
    expect(inv!.target).toBe(TEST_USERS.user2.id);
    expect(inv!.target_username).toBe(TEST_USERS.user2.username);
  });

  it("should retrieve outgoing bucket maintainer invitations", async () => {
    const { data, error } = await user1Client.rpc("get_outgoing_invitations", {
      invitation_type: "bucket_maintainer",
    });
    if (error) throw error;
    expect(data.length).toBeGreaterThanOrEqual(1);
    const inv = data.find((i: any) => i.resource_id === testBucketId);
    expect(inv).toBeDefined();
    expect(inv!.origin).toBe(TEST_USERS.user1.id);
    expect(inv!.target).toBe(TEST_USERS.user2.id);
    expect(inv!.target_username).toBe(TEST_USERS.user2.username);
  });

  it("should not allow a user to see another user's outgoing invitations", async () => {
    const { data, error } = await user2Client.rpc("get_outgoing_invitations", {
      invitation_type: "user",
    });
    if (error) throw error;
    expect(data.length).toBe(0);
  });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc(
      "get_outgoing_invitations",
      { invitation_type: "user" }
    );
    if (error) throw error;
    expect(data.length).toBe(0);
  });

  it("should respect pagination parameters", async () => {
    // Create a second user invitation for pagination testing
    const { data: bucketData2, error: bucketError2 } = await serviceClient
      .from("buckets")
      .insert({
        name: "pagination bucket",
        owner: TEST_USERS.user1.id,
        max_size: 2 * 1024 * 1024 * 1024,
        type: "large",
      })
      .select()
      .single();
    if (bucketError2) throw bucketError2;
    createdBuckets.push(bucketData2.id);

    const { data: inv2, error: invError2 } = await serviceClient
      .from("user_invitations")
      .insert({
        origin: TEST_USERS.user1.id,
        target: TEST_USERS.user2.id,
        bucket_id: bucketData2.id,
        bucket_name: "pagination bucket",
      })
      .select()
      .single();
    if (invError2) throw invError2;
    userInvitations.push(inv2);

    const { data, error } = await user1Client.rpc("get_outgoing_invitations", {
      invitation_type: "user",
      page_number: 0,
      items_per_page: 1,
    });
    if (error) throw error;
    expect(data.length).toBe(1);

    // No manual cleanup needed - afterAll will handle it
  });
});
