import { type Context } from "hono";
import { ChatConfig } from "./chat-config.js";
import { ChatRequest } from "./chat-request.js";
import { chatPayloadSchema, practicePayloadSchema } from "./schema.js";
import { StandardChatHandler } from "./standard-chat-handler.js";
import { PracticeChatHandler } from "./practice-chat-handler.js";

export class ChatHandlerFactory {
  static async createStandardChatHandler(
    c: Context
  ): Promise<StandardChatHandler> {
    const chatRequest = await ChatRequest.fromRequest(c, chatPayloadSchema);
    const config = await ChatConfig.create(
      chatRequest.selectedChatModelId,
      chatRequest.filter.bucketId,
      chatRequest.reasoningEnabled
    );

    return new StandardChatHandler(chatRequest, config);
  }

  static async createPracticeChatHandler(
    c: Context
  ): Promise<PracticeChatHandler> {
    const chatRequest = await ChatRequest.fromRequest(c, practicePayloadSchema);
    const config = await ChatConfig.create(
      chatRequest.selectedChatModelId,
      chatRequest.filter.bucketId
    );

    return new PracticeChatHandler(chatRequest, config);
  }
}

export * from "./chat-config.js";
export * from "./chat-handler.js";
export * from "./chat-request.js";
export * from "./standard-chat-handler.js";
