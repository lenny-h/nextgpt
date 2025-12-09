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
import {
  createTestBucket,
  createTestCourse,
  deleteTestBucket,
  deleteTestCourse,
} from "../helpers/db-helpers.js";
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
              { type: "text-delta", id: "text-1", delta: "Practice" },
              { type: "text-delta", id: "text-1", delta: " question" },
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

describe("Protected API Routes - Practice (Streaming)", () => {
  const client = testClient<ApiAppType>(app);
  let user1Cookie: string;
  let bucketId: string;
  let courseId: string;

  beforeAll(async () => {
    user1Cookie = await signInTestUser(
      TEST_USERS.USER1_VERIFIED.email,
      TEST_USERS.USER1_VERIFIED.password
    );

    bucketId = await createTestBucket(TEST_USERS.USER1_VERIFIED.id);
    courseId = await createTestCourse(TEST_USERS.USER1_VERIFIED.id, bucketId);
  });

  afterAll(async () => {
    if (courseId) {
      await deleteTestCourse(courseId);
    }
    if (bucketId) {
      await deleteTestBucket(bucketId);
    }
  });

  it("should successfully stream a practice session with multipleChoice mode", async () => {
    const chatId = generateTestUUID();
    const messageId = generateTestUUID();

    const response = await client.api.protected.practice.$post(
      {
        json: {
          id: chatId,
          message: {
            id: messageId,
            role: "user",
            content: "START",
            createdAt: new Date(),
            parts: [{ type: "text", text: "START" }],
            metadata: {
              filter: {
                bucket: { id: bucketId },
                courses: [{ id: courseId }],
                files: [],
                studyMode: "multipleChoice",
              },
              isStartMessage: true,
              attachments: [],
            },
          },
          modelIdx: 0,
          isTemp: true,
          messageCount: 0,
        },
      },
      {
        headers: getAuthHeaders(user1Cookie),
      }
    );

    expect(response.status).toBe(200);

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

      expect(fullText).toContain("Practice");
      expect(fullText).toContain("question");
    }
  });

  it("should successfully stream a practice session with concepts mode", async () => {
    const chatId = generateTestUUID();
    const messageId = generateTestUUID();

    const response = await client.api.protected.practice.$post(
      {
        json: {
          id: chatId,
          message: {
            id: messageId,
            role: "user",
            content: "START",
            createdAt: new Date(),
            parts: [{ type: "text", text: "START" }],
            metadata: {
              filter: {
                bucket: { id: bucketId },
                courses: [{ id: courseId }],
                files: [],
                studyMode: "concepts",
              },
              isStartMessage: true,
              attachments: [],
            },
          },
          modelIdx: 0,
          isTemp: true,
          messageCount: 0,
        },
      },
      {
        headers: getAuthHeaders(user1Cookie),
      }
    );

    expect(response.status).toBe(200);
  });

  it("should successfully stream a practice session with facts mode", async () => {
    const chatId = generateTestUUID();
    const messageId = generateTestUUID();

    const response = await client.api.protected.practice.$post(
      {
        json: {
          id: chatId,
          message: {
            id: messageId,
            role: "user",
            content: "START",
            createdAt: new Date(),
            parts: [{ type: "text", text: "START" }],
            metadata: {
              filter: {
                bucket: { id: bucketId },
                courses: [{ id: courseId }],
                files: [],
                studyMode: "facts",
              },
              isStartMessage: true,
              attachments: [],
            },
          },
          modelIdx: 0,
          isTemp: true,
          messageCount: 0,
        },
      },
      {
        headers: getAuthHeaders(user1Cookie),
      }
    );

    expect(response.status).toBe(200);
  });

  it("should handle follow-up message in existing practice session", async () => {
    const chatId = generateTestUUID();
    const messageId = generateTestUUID();

    const response = await client.api.protected.practice.$post(
      {
        json: {
          id: chatId,
          message: {
            id: messageId,
            role: "user",
            content: "Explain more about the topic",
            createdAt: new Date(),
            parts: [{ type: "text", text: "Explain more about the topic" }],
            metadata: {
              filter: {
                bucket: { id: bucketId },
                courses: [{ id: courseId }],
                files: [],
                studyMode: "concepts",
              },
              isStartMessage: false, // Follow-up message
              attachments: [],
            },
          },
          modelIdx: 0,
          isTemp: true,
          messageCount: 2, // Previous messages exist
        },
      },
      {
        headers: getAuthHeaders(user1Cookie),
      }
    );

    expect(response.status).toBe(200);

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

      expect(fullText).toContain("Practice");
      expect(fullText).toContain("question");
    }
  });

  it("should fail with 400 due to AI SDK type validation if filter is missing studyMode", async () => {
    const chatId = generateTestUUID();
    const messageId = generateTestUUID();

    const response = await client.api.protected.practice.$post(
      {
        json: {
          id: chatId,
          message: {
            id: messageId,
            role: "user",
            content: "START",
            createdAt: new Date(),
            parts: [{ type: "text", text: "START" }],
            metadata: {
              filter: {
                bucket: { id: bucketId },
                courses: [],
                files: [],
                // @ts-ignore - Intentional malformed request test
                // Missing studyMode
              },
              isStartMessage: true,
              attachments: [],
            },
          },
          modelIdx: 0,
          isTemp: true,
          messageCount: 0,
        },
      },
      {
        headers: getAuthHeaders(user1Cookie),
      }
    );

    expect(response.status).toBe(400);
  });
});
