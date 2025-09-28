import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { generateUUID } from "../src/utils/utils.js";

// Define mocks with vi.hoisted
const mocks = vi.hoisted(() => {
  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "f4a17ea9-f163-4180-bf67-42ba797ab994",
              app_metadata: {
                bucket_ids: ["a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6"],
              },
            },
          },
          error: null,
        }),
      },
    },
    providers: {
      getModel: vi.fn().mockResolvedValue({
        model: {
          provider: "gemini-2.0-flash-001",
          modelId: "b7c8d9e0-f1a2-43b4-95c6-d7e8f9a0b1c2",
        },
        isDefaultModel: true,
        providerOptions: {},
      }),
    },
    serverUtils: {
      userHasPermissions: vi.fn().mockResolvedValue(true),
      generateTitleFromUserMessage: vi
        .fn()
        .mockResolvedValue("Test Chat Title"),
    },
    chatsQueries: {
      getChatById: vi.fn().mockImplementation(() => {
        return null;
      }),
      saveChat: vi.fn().mockImplementation(({ id, userId, title }) => {
        return Promise.resolve({
          id,
          user_id: userId,
          title,
          created_at: new Date().toISOString(),
          is_favourite: false,
        });
      }),
      updateChatFavouriteStatus: vi
        .fn()
        .mockImplementation(({ id, isFavourite }) => {
          return Promise.resolve({
            id,
            is_favourite: isFavourite,
          });
        }),
      deleteChatById: vi.fn().mockResolvedValue(undefined),
    },
    messagesQueries: {
      saveMessages: vi.fn().mockResolvedValue(undefined),
    },
    documentQueries: {
      getDocument: vi.fn().mockResolvedValue(undefined),
    },
    retrieveContext: {
      getEmbedding: vi.fn().mockResolvedValue([]),
      getSources: vi.fn().mockResolvedValue([]),
    },
  };
});

// Mock the imported modules
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(() => {
    return {
      auth: {
        getUser: mocks.supabase.auth.getUser,
      },
    };
  }),
}));

vi.mock("@/lib/providers", () => ({
  getModel: mocks.providers.getModel,
}));

// Mock the AI functions
vi.mock("ai", () => ({
  generateText: vi.fn().mockResolvedValue({
    toolCalls: [
      {
        args: {
          doRag: false,
          keywords: [],
          questions: [],
          pageNumbers: [],
        },
      },
    ],
  }),
  createDataStreamResponse: ({
    onError,
  }: {
    onError?: (error: Error) => string;
  }) => {
    try {
      return new Response(null, { status: 200 });
    } catch (error) {
      if (onError && error instanceof Error) {
        const errorMessage = onError(error);
        return new Response(errorMessage, { status: 500 });
      }
      return new Response("Internal server error", { status: 500 });
    }
  },
  streamText: vi.fn().mockReturnValue({
    consumeStream: vi.fn(),
    mergeIntoDataStream: vi.fn(),
    response: {
      messages: [],
    },
  }),
  smoothStream: vi.fn().mockImplementation(() => {
    return function mockTransformStream() {
      // Return a mock TransformStream
      return {
        readable: new ReadableStream({
          start(controller) {
            controller.close();
          },
        }),
        writable: new WritableStream({
          write() {},
          close() {},
        }),
      };
    };
  }),
  tool: vi.fn().mockReturnValue({}),
}));

vi.mock("@/utils/server/user-has-permissions", () => ({
  userHasPermissions: mocks.serverUtils.userHasPermissions,
}));

vi.mock("@/utils/server/generate-title", () => ({
  generateTitleFromUserMessage: mocks.serverUtils.generateTitleFromUserMessage,
}));

// Mock the database queries
vi.mock("@/lib/db/queries/chats", () => ({
  getChatById: mocks.chatsQueries.getChatById,
  saveChat: mocks.chatsQueries.saveChat,
  updateChatFavouriteStatus: mocks.chatsQueries.updateChatFavouriteStatus,
  deleteChatById: mocks.chatsQueries.deleteChatById,
}));

vi.mock("@/lib/db/queries/messages", () => ({
  saveMessages: mocks.messagesQueries.saveMessages,
}));

vi.mock("@/lib/db/queries/documents", () => ({
  getDocument: mocks.documentQueries.getDocument,
}));

vi.mock("@/lib/tools/retrieve-context", () => ({
  getEmbedding: mocks.retrieveContext.getEmbedding,
  getSources: mocks.retrieveContext.getSources,
}));

// Import the Hono route handlers
import { DELETE, PATCH, POST } from "../src/routes/protected/chat/route.js";

// Helper function to create mock Hono context
function createMockContext(
  req: Request,
  queryParams: Record<string, string> = {},
  user?: any
) {
  return {
    req: {
      raw: req,
      query: (key: string) => queryParams[key],
    },
    get: (key: string) => {
      if (key === "user")
        return user || { id: "f4a17ea9-f163-4180-bf67-42ba797ab994" };
      return undefined;
    },
    json: (data: any) => Response.json(data),
    text: (text: string) => new Response(text),
  } as any;
}

describe("Chat API route tests", () => {
  let chatId: string;
  let bucketId: string;

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-05-20"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    chatId = generateUUID();
    bucketId = generateUUID();
    vi.clearAllMocks();
  });

  test("POST endpoint creates a new chat with valid request", async () => {
    // Mock getChatById to throw for non-existing chat
    mocks.chatsQueries.getChatById.mockRejectedValue(
      new Error("Chat not found")
    );

    // Create request with necessary data
    const req = new Request("http://localhost:3000/capi/protected/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: chatId,
        messages: [
          {
            id: "c3d4e5f6-a7b8-49c0-b1d2-e3f4a5b6c7d8",
            role: "user",
            content: "Hello",
            annotations: [],
          },
        ],
        f: {
          bucketId: bucketId,
          courses: [],
          files: [],
          documents: [],
        },
        c: "chat-model-small",
        s: false,
        r: false,
      }),
    });

    const mockContext = createMockContext(req);

    // Call the API handler
    const response = await POST(mockContext);

    // Verify the response
    expect(response.status).toBe(200);

    // Check that the appropriate functions were called
    expect(mocks.chatsQueries.saveChat).toHaveBeenCalledWith({
      id: chatId,
      userId: "f4a17ea9-f163-4180-bf67-42ba797ab994",
      title: "Test Chat Title",
    });
  });

  test("POST endpoint handles temporary chats correctly", async () => {
    // Create request for temporary chat
    const req = new Request("http://localhost:3000/capi/protected/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: chatId,
        messages: [
          {
            id: "d4e5f6a7-b8c9-40d1-b2e3-f4a5b6c7d8e9",
            role: "user",
            content: "Hello",
            annotations: [],
          },
        ],
        f: {
          bucketId: bucketId,
          courses: [],
          files: [],
          documents: [],
        },
        c: "chat-model-small",
        s: true,
        r: false,
      }),
    });

    const mockContext = createMockContext(req);

    // Call the API handler
    const response = await POST(mockContext);

    // Verify the response
    expect(response.status).toBe(200);

    // Check that save functions weren't called for temporary chat
    expect(mocks.chatsQueries.saveChat).not.toHaveBeenCalled();
  });

  test("PATCH endpoint updates chat favorite status", async () => {
    // Setup mock for getChatById to return existing chat
    mocks.chatsQueries.getChatById.mockResolvedValue({
      id: chatId,
      user_id: "f4a17ea9-f163-4180-bf67-42ba797ab994",
      title: "Existing Chat",
    });

    const req = new Request("http://localhost:3000/capi/protected/chat", {
      method: "PATCH",
    });
    const mockContext = createMockContext(req, { id: chatId, fav: "true" });

    const response = await PATCH(mockContext);
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData.is_favourite).toBe(true);
    expect(responseData.id).toBe(chatId);
  });

  test("DELETE endpoint deletes a chat", async () => {
    // Setup mock for getChatById to return existing chat
    mocks.chatsQueries.getChatById.mockResolvedValue({
      id: chatId,
      user_id: "f4a17ea9-f163-4180-bf67-42ba797ab994",
      title: "Chat to Delete",
    });

    const req = new Request("http://localhost:3000/capi/protected/chat", {
      method: "DELETE",
    });
    const mockContext = createMockContext(req, { id: chatId });

    const response = await DELETE(mockContext);
    expect(response.status).toBe(200);

    // Check that deleteChatById was called with the correct ID
    expect(mocks.chatsQueries.deleteChatById).toHaveBeenCalledWith({
      id: chatId,
    });
  });

  test("POST endpoint returns 403 when user lacks permissions", async () => {
    // Override the mocked userHasPermissions function
    mocks.serverUtils.userHasPermissions.mockResolvedValue(false);

    const req = new Request("http://localhost:3000/capi/protected/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: chatId,
        messages: [
          {
            id: "f6a7b8c9-d0e1-42f3-b4a5-b6c7d8e9f0a1",
            role: "user",
            content: "Hello",
            annotations: [],
          },
        ],
        f: {
          bucketId: bucketId,
          courses: [],
          files: [],
          documents: [],
        },
        c: "chat-model-small",
        s: false,
        r: false,
      }),
    });

    const mockContext = createMockContext(req);

    const response = await POST(mockContext);
    expect(response.status).toBe(403);
  });

  test("POST endpoint returns 401 when user is not authenticated", async () => {
    // Override the mocked getUser function
    mocks.supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const req = new Request("http://localhost:3000/capi/protected/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: chatId,
        messages: [
          {
            id: "e5f6a7b8-c9d0-41e2-b3f4-a5b6c7d8e9f0",
            role: "user",
            content: "Hello",
            annotations: [],
          },
        ],
        f: {
          bucketId: bucketId,
          courses: [],
          files: [],
          documents: [],
        },
        c: "chat-model-small",
        s: false,
        r: false,
      }),
    });

    const mockContext = createMockContext(req);

    const response = await POST(mockContext);
    expect(response.status).toBe(401);
  });
});
