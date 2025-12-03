import * as z from "zod";

import { type Attachment } from "@workspace/api-routes/schemas/attachment-schema.js";
import { userHasPermissions } from "@workspace/api-routes/utils/user-has-permissions.js";
import { User } from "@workspace/server/drizzle/schema.js";
import { createLogger } from "@workspace/server/logger.js";
import { validateUIMessages } from "ai";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { dataSchemas } from "../../schemas/data-schemas.js";
import { type Filter } from "../../schemas/filter-schema.js";
import { metadataSchema } from "../../schemas/metadata-schema.js";
import { type PracticeFilter } from "../../schemas/practice-filter-schema.js";
import { type MyUIMessage } from "../../types/custom-ui-message.js";
import { getMessagesByChatId } from "../db/queries/messages.js";
import { tools } from "../tools/index.js";

const logger = createLogger("chat-request");

export class ChatRequest {
  public readonly id: string; // Chat ID
  public readonly messages: MyUIMessage[];
  public readonly lastMessage: MyUIMessage;
  public readonly filter: Filter | PracticeFilter; // Search filter
  public readonly attachments: Attachment[]; // Attachments in the last message

  public readonly selectedChatModel: number;
  public readonly isTemporary: boolean; // Whether to save the chat or not
  public readonly user: User;

  public readonly reasoningEnabled?: boolean;
  public readonly webSearchEnabled?: boolean;
  public readonly timezone?: string; // User's timezone from browser

  constructor(
    id: string,
    messages: MyUIMessage[],
    selectedChatModel: number,
    isTemporary: boolean,
    user: User,
    reasoningEnabled?: boolean,
    webSearchEnabled?: boolean,
    timezone?: string
  ) {
    this.id = id;
    this.messages = messages;
    this.lastMessage = messages[messages.length - 1];

    if (!this.lastMessage.metadata?.filter) {
      logger.warn("Missing filter in message metadata");
      throw new HTTPException(400, {
        message: "BAD_REQUEST",
      });
    }

    this.filter = this.lastMessage.metadata.filter;
    this.attachments = this.lastMessage.metadata?.attachments || [];

    this.selectedChatModel = selectedChatModel;
    this.isTemporary = isTemporary;
    this.user = user;

    this.reasoningEnabled = reasoningEnabled;
    this.webSearchEnabled = webSearchEnabled;
    this.timezone = timezone;

    logger.debug("ChatRequest constructed", {
      chatId: id,
      userId: user.id,
      messageCount: messages.length,
      attachmentCount: this.attachments.length,
      isTemporary,
      selectedChatModel,
      reasoningEnabled,
      webSearchEnabled,
      timezone,
    });
  }

  static async fromRequest(
    c: Context,
    schema: z.ZodType<any>
  ): Promise<ChatRequest> {
    const payload = await c.req.json();
    const validatedPayload = schema.parse(payload);

    const user = c.get("user");

    const {
      id,
      message,
      messageCount,
      modelIdx: selectedChatModel,
      isTemp: isTemporary,
      reasoning: reasoningEnabled,
      webSearch: webSearchEnabled,
      timezone,
    } = validatedPayload;

    logger.debug("Creating ChatRequest from incoming request", {
      chatId: id,
      userId: user.id,
      messageCount,
      selectedChatModel,
      isTemporary,
      reasoningEnabled,
      webSearchEnabled,
      timezone,
    });

    // For practice chats with lastStartMessageIndex, only retrieve messages after that index
    const prevMessages = await getMessagesByChatId({
      chatId: id,
      messageCount: messageCount ? Math.min(messageCount, 12) : 12,
    });

    const messages = [...prevMessages.reverse(), message];

    const validatedUIMessages = await validateUIMessages<MyUIMessage>({
      messages,
      dataSchemas,
      metadataSchema,
      tools,
    });

    // Disallow file parts in chat messages
    // File parts should be handled as attachments, not inline in messages
    // Once the attachments are validated, they will be integrated into the last user message
    const containsFilePart = validatedUIMessages.some((m) => {
      return m.parts.some((p) => p.type === "file");
    });

    if (containsFilePart) {
      logger.warn("Request contains disallowed file parts in messages", {
        chatId: id,
        userId: user.id,
      });
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }

    return new ChatRequest(
      id,
      validatedUIMessages,
      selectedChatModel,
      isTemporary,
      user,
      reasoningEnabled,
      webSearchEnabled,
      timezone
    );
  }

  async validatePermissions(): Promise<void> {
    logger.debug("Validating user permissions", {
      chatId: this.id,
      userId: this.user.id,
      bucketId: this.filter.bucket.id,
      courseCount: this.filter.courses.length,
      fileCount: this.filter.files.length,
      attachmentCount: this.attachments.length,
    });

    const hasPermission = await userHasPermissions({
      userId: this.user.id,
      filterBucketId: this.filter.bucket.id,
      filterCourseIds: this.filter.courses.map((c) => c.id),
      filterFileIds: this.filter.files.map((f) => f.id),
      filterAttachments: this.attachments,
      filterDocumentIds:
        "documents" in this.filter
          ? this.filter.documents.map((d) => d.id)
          : [],
      filterPromptIds:
        "prompts" in this.filter ? this.filter.prompts.map((p) => p.id) : [],
    });

    if (!hasPermission) {
      logger.warn("Permission validation failed", {
        chatId: this.id,
        userId: this.user.id,
        bucketId: this.filter.bucket.id,
        courseIds: this.filter.courses.map((c) => c.id),
        fileIds: this.filter.files.map((f) => f.id),
      });
      throw new HTTPException(403, { message: "FORBIDDEN" });
    }
  }

  validateUserMessage(): void {
    if (this.lastMessage.role !== "user") {
      logger.warn("Last message is not from user");
      throw new HTTPException(400, {
        message: "BAD_REQUEST",
      });
    }
  }
}
