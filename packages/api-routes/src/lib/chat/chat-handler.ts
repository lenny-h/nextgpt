import { Chat } from "@workspace/server/drizzle/schema.js";
import { createLogger } from "@workspace/server/logger.js";
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
import { getChatById, saveChat } from "../db/queries/chats.js";
import { getDocument } from "../db/queries/documents.js";
import { saveMessages } from "../db/queries/messages.js";
import { getPromptsByIds } from "../db/queries/prompts.js";
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
    if (this.request.isTemporary) return undefined;

    let createdChat: Chat | undefined;

    try {
      await getChatById({ id: this.request.id });
    } catch (error) {
      const title = await this.generateChatTitle();

      logger.debug("Generated chat title", { chatId: this.request.id, title });

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
    const messagesWithAttachments = await integrateAttachmentsIntoMessages(
      this.request.messages,
      this.request.attachments
    );
    const messagesWithContext = await this.integrateDocumentsIntoMessages(
      messagesWithAttachments
    );

    let modelMessages = await convertToModelMessages(messagesWithContext);

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
      messages,
    });

    await saveMessages({
      chatId: this.request.id,
      newMessages: messages,
    });
  }

  protected async buildBaseSystemPrompt(
    initialSystemPrompt: string
  ): Promise<string> {
    let finalPrompt = initialSystemPrompt;

    // Add current date and time information
    const currentDate = new Date();
    const dateString = currentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeString = currentDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    finalPrompt += `\n\n## Current Context\n\n`;
    finalPrompt += `Today's date is ${dateString} at ${timeString}.\n`;

    // Add user location if available
    if (this.request.timezone) {
      finalPrompt += `The user is in the timezone: ${this.request.timezone}.\n`;
    }

    // Check if the filter has prompts
    if (
      "prompts" in this.request.filter &&
      this.request.filter.prompts &&
      this.request.filter.prompts.length > 0
    ) {
      const promptIds = this.request.filter.prompts.map((p) => p.id);

      logger.debug("Fetching custom prompts", {
        chatId: this.request.id,
        promptCount: promptIds.length,
      });

      const userPrompts = await getPromptsByIds(promptIds);

      if (userPrompts.length > 0) {
        // Create a map to preserve the order from the filter
        const promptMap = new Map(userPrompts.map((p) => [p.id, p.content]));

        // Build the custom instructions section in the order provided by the user
        const orderedPrompts = promptIds.map((id) => promptMap.get(id));

        if (orderedPrompts.length > 0) {
          finalPrompt += "\n\n## Custom Instructions\n\n";
          finalPrompt +=
            "The user has provided the following custom instructions. Please follow them carefully:\n\n";

          orderedPrompts.forEach((content, index) => {
            finalPrompt += `### Instruction ${index + 1}\n${content}\n\n`;
          });
        }
      }
    }

    return finalPrompt;
  }

  protected async integrateDocumentsIntoMessages(
    messages: MyUIMessage[]
  ): Promise<MyUIMessage[]> {
    if (messages.length === 0) return messages;

    // Check if the filter has documents (max 1 document allowed)
    if (this.request.filter.documents.length > 0) {
      const documentId = this.request.filter.documents[0].id;

      logger.debug("Fetching document for context", {
        chatId: this.request.id,
        documentId,
      });

      try {
        const document = await getDocument({ id: documentId });

        let contextText = `\n\n## Document Content\n\n`;
        contextText += `Title: ${document.title}\n`;
        contextText += `Content:\n${document.content}\n\n`;

        const newParts = [
          ...this.request.lastMessage.parts,
          {
            type: "text",
            text: contextText,
          } as const,
        ];

        return [
          ...messages.slice(0, -1),
          {
            ...this.request.lastMessage,
            parts: newParts,
          },
        ];
      } catch (error) {
        logger.warn("Failed to fetch document for context", {
          chatId: this.request.id,
          documentId,
          error,
        });
      }
    }

    return messages;
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
