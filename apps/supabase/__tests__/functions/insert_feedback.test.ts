import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("insert_feedback function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  // Store feedback records to clean up using the composite primary key
  let insertedFeedbacks: { user_id: string; created_at: string }[] = [];

  beforeAll(async () => {
    user1Client = await signInUser(
      TEST_USERS.user1.email,
      TEST_USERS.user1.password
    );
    anonymousClient = createUnauthenticatedClient();
    serviceClient = createServiceClient();
  });

  afterAll(async () => {
    // Clean up all inserted feedback
    for (const feedback of insertedFeedbacks) {
      await serviceClient
        .from("feedback")
        .delete()
        .eq("user_id", feedback.user_id)
        .eq("created_at", feedback.created_at);
    }
  });

  it("should allow a user to insert feedback", async () => {
    const testData = generateTestData();
    const subject = `Test Subject ${testData.timestamp}`;
    const content = `This is test feedback content ${testData.timestamp}`;

    const { error } = await user1Client.rpc("insert_feedback", {
      p_subject: subject,
      p_content: content,
    });

    if (error) throw error;

    // Verify the feedback was inserted
    const { data, error: fetchError } = await serviceClient
      .from("feedback")
      .select()
      .eq("user_id", TEST_USERS.user1.id)
      .eq("subject", subject)
      .eq("content", content);

    if (fetchError) throw fetchError;

    expect(data.length).toBe(1);
    expect(data[0].subject).toBe(subject);
    expect(data[0].content).toBe(content);

    // Store the composite key fields for cleanup
    insertedFeedbacks.push({
      user_id: data[0].user_id,
      created_at: data[0].created_at,
    });
  });

  it("should reject feedback with subject longer than 64 characters", async () => {
    const longSubject = "a".repeat(65);
    const content = "Test content";

    const { error } = await user1Client.rpc("insert_feedback", {
      p_subject: longSubject,
      p_content: content,
    });

    expect(error).not.toBeNull();
    expect(error?.message).toContain("Subject must be less than 64 characters");
  });

  it("should reject feedback with content longer than 512 characters", async () => {
    const subject = "Test Subject";
    const longContent = "a".repeat(513);

    const { error } = await user1Client.rpc("insert_feedback", {
      p_subject: subject,
      p_content: longContent,
    });

    expect(error).not.toBeNull();
    expect(error?.message).toContain(
      "Content must be less than 512 characters"
    );
  });

  it("should not allow unauthenticated users to insert feedback", async () => {
    const subject = "Anonymous Subject";
    const content = "Anonymous Content";

    const { error } = await anonymousClient.rpc("insert_feedback", {
      p_subject: subject,
      p_content: content,
    });

    expect(error).not.toBeNull();
    expect(error?.message).toContain("violates row-level security policy");
  });
});
