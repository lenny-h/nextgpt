import { Chat } from "@workspace/server/drizzle/schema.js";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  streamText,
  type Tool,
  type UIMessageStreamWriter,
} from "ai";
import { type MyUIMessage } from "../../types/custom-ui-message.js";
import { createLogger } from "../../utils/logger.js";
import { getChatById, saveChat } from "../db/queries/chats.js";
import { saveMessages } from "../db/queries/messages.js";
import { ChatConfig } from "./chat-config.js";
import { ChatRequest } from "./chat-request.js";
import { integrateAttachmentsIntoMessages } from "./process-attachments.js";

const logger = createLogger("chat-handler");

type StreamTextInput = Parameters<typeof streamText>[0];

export abstract class ChatHandler {
  protected request: ChatRequest;
  protected config: ChatConfig;

  constructor(request: ChatRequest, config: ChatConfig) {
    this.request = request;
    this.config = config;
  }

  async handleRequest(): Promise<Response> {
    await this.request.validatePermissions(); // Check if user has permissions to access content referenced in messages
    this.request.validateUserMessage(); // Check if last message is from the user
    await this.validateSpecificRequirements();

    const createdChat = await this.handleChatCreation();

    const stream = createUIMessageStream<MyUIMessage>({
      execute: async ({ writer }) => {
        if (createdChat) {
          writer.write({
            type: "data-chat",
            data: { id: createdChat.id },
            transient: true,
          });
        }

        await this.executeChat(writer);
      },
      onError: (error) => this.handleError(error),
    });

    return createUIMessageStreamResponse({ stream });
  }

  protected async handleChatCreation(): Promise<Chat | undefined> {
    if (this.request.isTemporary) {
      return undefined;
    }

    let createdChat: Chat | undefined;

    try {
      await getChatById({ id: this.request.id });
    } catch (error) {
      const title = await this.generateChatTitle();
      createdChat = await saveChat({
        id: this.request.id,
        userId: this.request.user.id,
        title,
      });
    }

    await this.saveUserMessage();
    return createdChat;
  }

  protected async saveUserMessage(): Promise<void> {
    logger.debug("Saving user message", { chatId: this.request.id });
    await saveMessages({
      chatId: this.request.id,
      newMessages: [this.request.lastMessage],
    });
  }

  protected async createStreamTextConfig({
    systemPrompt,
  }: {
    systemPrompt: string;
  }): Promise<StreamTextInput> {
    const modifiedMessages = await integrateAttachmentsIntoMessages(
      this.request.messages,
      this.request.attachments
    );

    let modelMessages = convertToModelMessages(modifiedMessages);

    return {
      model: this.config.modelId,
      system: systemPrompt,
      messages: modelMessages,
      experimental_transform: smoothStream({
        chunking: "line",
      }),
      providerOptions: this.config.providerOptions,
    };
  }

  protected async saveResponseMessages(messages: MyUIMessage[]): Promise<void> {
    if (this.request.isTemporary) return;

    logger.debug("Saving response messages", {
      chatId: this.request.id,
      messageCount: messages.length,
    });
    await saveMessages({
      chatId: this.request.id,
      newMessages: messages,
    });
  }

  // Abstract methods to be implemented by subclasses
  protected abstract validateSpecificRequirements(): Promise<void>;
  protected abstract generateChatTitle(): Promise<string>;
  protected abstract retrieveToolSet(
    writer: UIMessageStreamWriter<MyUIMessage>
  ): Record<string, Tool>;
  protected abstract executeChat(
    writer: UIMessageStreamWriter<MyUIMessage>
  ): Promise<void>;
  protected abstract handleError(error: any): string;
}
