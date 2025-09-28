import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  type Tool,
  type UIMessageStreamWriter,
} from "ai";
import { type MyUIMessage } from "../../types/custom-ui-message.js";
import { type Tables } from "../../types/database.js";
import { generateUUID } from "../../utils/utils.js";
import { getChatById, saveChat } from "../db/queries/chats.js";
import { saveMessages } from "../db/queries/messages.js";
import { ChatConfig } from "./chat-config.js";
import { ChatRequest } from "./chat-request.js";

export abstract class ChatHandler {
  protected request: ChatRequest;
  protected config: ChatConfig;

  constructor(request: ChatRequest, config: ChatConfig) {
    this.request = request;
    this.config = config;
  }

  async handleRequest(): Promise<Response> {
    await this.request.validatePermissions();
    this.request.validateUserMessage();
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

  protected async handleChatCreation(): Promise<Tables<"chats"> | undefined> {
    if (this.request.isTemporary) {
      return undefined;
    }

    let createdChat: Tables<"chats"> | undefined;

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
    await saveMessages({
      chatId: this.request.id,
      newMessages: [this.request.lastMessage],
    });
  }

  protected createStreamTextConfig({ systemPrompt }: { systemPrompt: string }) {
    return {
      system: systemPrompt,
      model: this.config.modelId,
      messages: convertToModelMessages(this.request.messages),
      experimental_generateMessageId: generateUUID,
      experimental_transform: smoothStream({
        chunking: "line",
      }),
      providerOptions: this.config.providerOptions,
    };
  }

  protected async saveResponseMessages(messages: MyUIMessage[]): Promise<void> {
    if (this.request.isTemporary) return;

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
