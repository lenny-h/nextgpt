import { simulateReadableStream } from "ai";
import { MockLanguageModelV2 } from "ai/test";
import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import app, { type ApiAppType } from "../../src/app.js";
import {
  TEST_USERS,
  getAuthHeaders,
  signInTestUser,
} from "../helpers/auth-helpers.js";
import { createTestBucket, deleteTestBucket } from "../helpers/db-helpers.js";
import { generateTestUUID } from "../helpers/test-utils.js";

// Mock the getModel function from providers
vi.mock("@workspace/api-routes/lib/providers.js", () => ({
  getModel: vi.fn().mockImplementation(async () => {
    return {
      model: new MockLanguageModelV2({
        doStream: async () => ({
          stream: simulateReadableStream({
            chunks: [
              { type: "text-start", id: "text-1" },
              { type: "text-delta", id: "text-1", delta: "Hello" },
              { type: "text-delta", id: "text-1", delta: " world" },
              { type: "text-end", id: "text-1" },
              {
                type: "finish",
                finishReason: "stop",
                logprobs: undefined,
                usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
              },
            ],
          }),
        }),
      }),
      providerOptions: {},
    };
  }),
}));

describe("Protected API Routes - Chat (Streaming)", () => {
  const client = testClient<ApiAppType>(app);
  let user1Cookie: string;
  let bucketId: string;

  beforeAll(async () => {
    user1Cookie = await signInTestUser(
      TEST_USERS.USER1_VERIFIED.email,
      TEST_USERS.USER1_VERIFIED.password
    );

    bucketId = await createTestBucket(TEST_USERS.USER1_VERIFIED.id);
  });

  afterAll(async () => {
    if (bucketId) {
      await deleteTestBucket(bucketId);
    }
  });

  it("should successfully stream a chat response", async () => {
    const chatId = generateTestUUID();
    const messageId = generateTestUUID();

    const response = await client.api.protected.chat.$post(
      {
        json: {
          id: chatId,
          message: {
            id: messageId,
            role: "user",
            content: "Hello AI",
            createdAt: new Date(),
            parts: [{ type: "text", text: "Hello AI" }],
            metadata: {
              filter: {
                bucket: { id: bucketId },
                courses: [],
                files: [],
                documents: [],
                prompts: [],
              },
              attachments: [],
            },
          },
          modelIdx: 0,
          isTemp: true,
          reasoning: false,
          webSearch: false,
        },
      },
      {
        headers: getAuthHeaders(user1Cookie),
      }
    );

    expect(response.status).toBe(200);

    // Verify it is a stream
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    if (reader) {
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      expect(fullText).toContain("Hello");
      expect(fullText).toContain("world");
    }
  });

  it("should fail if filter bucket is missing", async () => {
    const chatId = generateTestUUID();
    const messageId = generateTestUUID();

    const response = await client.api.protected.chat.$post(
      {
        json: {
          id: chatId,
          message: {
            id: messageId,
            role: "user",
            content: "Hello",
            createdAt: new Date(),
            parts: [{ type: "text", text: "Hello" }],
            // @ts-ignore - Intentional malformed request test
            metadata: {
              // Missing filter
            },
          },
          modelIdx: 0,
          isTemp: true,
        },
      },
      {
        headers: getAuthHeaders(user1Cookie),
      }
    );

    expect(response.status).toBe(400);
  });
});
