import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("get_user_prompts function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testPromptId: string;

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

    // Create a test prompt for user1
    const testData = generateTestData();
    const { data: promptData, error } = await serviceClient
      .from("prompts")
      .insert({
        name: testData.title,
        user_id: TEST_USERS.user1.id,
        content: "This is a test prompt content.",
      })
      .select()
      .single();

    if (error) throw error;

    testPromptId = promptData.id;
  });

  afterAll(async () => {
    // Clean up the test data
    if (testPromptId) {
      await serviceClient.from("prompts").delete().eq("id", testPromptId);
    }
  });

  it("should allow a user to retrieve their own prompts", async () => {
    const { data, error } = await user1Client.rpc("get_user_prompts");

    if (error) throw error;

    expect(data.length).toBeGreaterThanOrEqual(1);

    // Verify our test prompt is in the results
    const testPrompt = data.find((prompt) => prompt.id === testPromptId);
    expect(testPrompt).toBeDefined();
    expect(testPrompt!.name).toBeDefined();
    expect(testPrompt!.content).toBeDefined();
  });

  it("should not allow a user to access another user's prompts", async () => {
    // Create a prompt for user2
    const user2TestData = generateTestData();
    const { data: user2PromptData, error: user2PromptError } =
      await serviceClient
        .from("prompts")
        .insert({
          name: user2TestData.title,
          user_id: TEST_USERS.user2.id,
          content: "This is user2's private prompt.",
        })
        .select()
        .single();

    if (user2PromptError) throw user2PromptError;

    try {
      // User1 should not see User2's prompts
      const { data: user1Prompts, error: user1Error } =
        await user1Client.rpc("get_user_prompts");
      if (user1Error) throw user1Error;

      // User2's prompt should not be in User1's results
      const user2PromptInUser1Results = user1Prompts.find(
        (prompt) => prompt.id === user2PromptData.id
      );
      expect(user2PromptInUser1Results).toBeUndefined();

      // User2 should not see User1's prompts
      const { data: user2Prompts, error: user2Error } =
        await user2Client.rpc("get_user_prompts");
      if (user2Error) throw user2Error;

      // User1's prompt should not be in User2's results
      const user1PromptInUser2Results = user2Prompts.find(
        (prompt) => prompt.id === testPromptId
      );
      expect(user1PromptInUser2Results).toBeUndefined();
    } finally {
      // Clean up user2's prompt
      if (user2PromptData?.id) {
        await serviceClient
          .from("prompts")
          .delete()
          .eq("id", user2PromptData.id);
      }
    }
  });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc("get_user_prompts");

    if (error) throw error;

    expect(data.length).toBe(0);
  });
});
