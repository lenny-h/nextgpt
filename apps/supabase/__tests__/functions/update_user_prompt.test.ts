import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("update_correction_prompt function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testPromptId: string;
  let user2PromptId: string;
  let originalContent: string;

  beforeAll(async () => {
    user1Client = await signInUser(
      TEST_USERS.user1.email,
      TEST_USERS.user1.password
    );
    anonymousClient = createUnauthenticatedClient();
    serviceClient = createServiceClient();

    // Create a test prompt for user1
    const testData = generateTestData();
    originalContent = `This is the original prompt content: ${testData.timestamp}`;

    const { data: promptData, error: promptError } = await serviceClient
      .from("prompts")
      .insert({
        name: `Test Prompt: ${testData.title}`,
        content: originalContent,
        user_id: TEST_USERS.user1.id,
      })
      .select()
      .single();

    if (promptError) throw promptError;

    testPromptId = promptData.id;

    // Create a test prompt for user2
    const user2TestData = generateTestData();
    const { data: user2PromptData, error: user2PromptError } =
      await serviceClient
        .from("prompts")
        .insert({
          name: `User2 Test Prompt: ${user2TestData.title}`,
          content: `This is a test prompt content for user2: ${user2TestData.timestamp}`,
          user_id: TEST_USERS.user2.id,
        })
        .select()
        .single();

    if (user2PromptError) throw user2PromptError;

    user2PromptId = user2PromptData.id;
  });

  afterAll(async () => {
    // Clean up the test prompts
    if (testPromptId) {
      await serviceClient.from("prompts").delete().eq("id", testPromptId);
    }
    if (user2PromptId) {
      await serviceClient.from("prompts").delete().eq("id", user2PromptId);
    }
  });

  it("should allow a user to update their own prompt", async () => {
    // Generate new content
    const newContent = `This is updated prompt content: ${new Date().toISOString()}`;

    // User1 updates their prompt
    const { error: updateError } = await user1Client.rpc(
      "update_correction_prompt",
      {
        p_id: testPromptId,
        p_content: newContent,
      }
    );

    if (updateError) throw updateError;

    // Verify the prompt has been updated
    const { data: promptData, error: fetchError } = await serviceClient
      .from("prompts")
      .select("content")
      .eq("id", testPromptId)
      .single();

    if (fetchError) throw fetchError;
    expect(promptData.content).toBe(newContent);
  });

  it("should not allow a user to update another user's prompt", async () => {
    // User1 tries to update User2's prompt
    const newContent = `This should not update: ${new Date().toISOString()}`;

    const { error: updateError } = await user1Client.rpc(
      "update_correction_prompt",
      {
        p_id: user2PromptId,
        p_content: newContent,
      }
    );

    if (updateError) throw updateError;

    // Verify the prompt has not been updated
    const { data: promptData, error: fetchError } = await serviceClient
      .from("prompts")
      .select("content")
      .eq("id", user2PromptId)
      .single();

    if (fetchError) throw fetchError;
    expect(promptData.content).not.toBe(newContent);
  });

  it("should not allow an unauthenticated user to update a prompt", async () => {
    // Anonymous user tries to update a prompt
    const newContent = `This anonymous update should fail: ${new Date().toISOString()}`;

    const { error: updateError } = await anonymousClient.rpc(
      "update_correction_prompt",
      {
        p_id: testPromptId,
        p_content: newContent,
      }
    );

    if (updateError) throw updateError;

    // Verify the prompt has not been updated
    const { data: promptData, error: fetchError } = await serviceClient
      .from("prompts")
      .select("content")
      .eq("id", testPromptId)
      .single();

    if (fetchError) throw fetchError;
    expect(promptData.content).not.toBe(newContent);
  });
});
