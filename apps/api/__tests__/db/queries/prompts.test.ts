import { afterAll, describe, expect, it, vi } from "vitest";
import {
  getPrompt,
  getPromptsCount,
  insertPrompt,
} from "../../../src/lib/db/queries/prompts.js";
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

describe("prompts.ts query tests", async () => {
  const testPrompts: { id: string }[] = [];

  const testUserId1 = TEST_USERS.user1.id;

  let testPromptId: string;
  let testPromptName: string;
  let testPromptContent: string;

  const supabase = createServiceClient();

  afterAll(async () => {
    // Clean up test data
    for (const prompt of testPrompts) {
      await cleanupTestData(supabase, "prompts", "id", prompt.id);
    }
  });

  it("should insert a prompt", async () => {
    // Arrange
    const promptData = generateTestData();
    testPromptName = promptData.title;
    testPromptContent = "This is a test prompt content";

    // Act
    await insertPrompt({
      userId: testUserId1,
      name: testPromptName,
      content: testPromptContent,
    });

    // Assert
    const { data: prompts, error } = await supabase
      .from("prompts")
      .select()
      .eq("user_id", testUserId1)
      .eq("name", testPromptName);

    if (error) {
      throw error;
    }

    expect(prompts.length).toBe(1);
    expect(prompts[0].content).toBe(testPromptContent);

    // Store prompt id for cleanup
    testPromptId = prompts[0].id;
    testPrompts.push({ id: testPromptId });
  });

  it("should get a prompt by id", async () => {
    // Act
    const content = await getPrompt(testPromptId);

    // Assert
    expect(content).toBe(testPromptContent);
  });

  it("should get prompts count for a user", async () => {
    // Arrange - Insert another prompt
    const promptData = generateTestData();
    const secondPromptName = promptData.title;
    const secondPromptContent = "This is another test prompt content";

    await insertPrompt({
      userId: testUserId1,
      name: secondPromptName,
      content: secondPromptContent,
    });

    // Get the inserted prompt for cleanup
    const { data: prompts, error } = await supabase
      .from("prompts")
      .select()
      .eq("user_id", testUserId1)
      .eq("name", secondPromptName);

    if (error) {
      throw error;
    }

    const secondPromptId = prompts[0].id;
    testPrompts.push({ id: secondPromptId });

    // Act
    const count = await getPromptsCount(testUserId1);

    // Assert
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
