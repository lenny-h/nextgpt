import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("delete_correction_prompt function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testPromptId: string;
  let user2PromptId: string;

  beforeAll(async () => {
    user1Client = await signInUser(
      TEST_USERS.user1.email,
      TEST_USERS.user1.password
    );
    anonymousClient = createUnauthenticatedClient();
    serviceClient = createServiceClient();

    // Create a test prompt for user1
    const testData = generateTestData();
    const { data: promptData, error: promptError } = await serviceClient
      .from("prompts")
      .insert({
        name: testData.title,
        content: `This is a test prompt content: ${testData.timestamp}`,
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
          name: user2TestData.title,
          content: `This is a test prompt content for user2: ${user2TestData.timestamp}`,
          user_id: TEST_USERS.user2.id,
        })
        .select()
        .single();

    if (user2PromptError) throw user2PromptError;

    user2PromptId = user2PromptData.id;
  });

  afterAll(async () => {
    // Clean up the test prompts if they still exist
    if (testPromptId) {
      await serviceClient.from("prompts").delete().eq("id", testPromptId);
    }
    if (user2PromptId) {
      await serviceClient.from("prompts").delete().eq("id", user2PromptId);
    }
  });

  it("should allow a user to delete their own prompt", async () => {
    // User1 deletes their prompt
    const { error: deleteError } = await user1Client.rpc(
      "delete_correction_prompt",
      {
        p_id: testPromptId,
      }
    );

    if (deleteError) throw deleteError;

    // Verify the prompt has been deleted
    const { data: promptData, error: fetchError } = await serviceClient
      .from("prompts")
      .select()
      .eq("id", testPromptId);

    if (fetchError) throw fetchError;
    expect(promptData.length).toBe(0);
  });

  it("should not allow a user to delete another user's prompt", async () => {
    // User1 tries to delete User2's prompt
    const { error: deleteError } = await user1Client.rpc(
      "delete_correction_prompt",
      {
        p_id: user2PromptId,
      }
    );

    if (deleteError) throw deleteError;

    // Verify the prompt has not been deleted
    const { data: promptData, error: fetchError } = await serviceClient
      .from("prompts")
      .select()
      .eq("id", user2PromptId);

    if (fetchError) throw fetchError;
    expect(promptData.length).toBe(1);
  });

  it("should not allow an unauthenticated user to delete a prompt", async () => {
    // Anonymous user tries to delete a prompt
    const { error: deleteError } = await anonymousClient.rpc(
      "delete_correction_prompt",
      {
        p_id: user2PromptId,
      }
    );

    if (deleteError) throw deleteError;

    // Verify the prompt has not been deleted
    const { data: promptData, error: fetchError } = await serviceClient
      .from("prompts")
      .select()
      .eq("id", user2PromptId);

    if (fetchError) throw fetchError;
    expect(promptData.length).toBe(1);
  });
});
