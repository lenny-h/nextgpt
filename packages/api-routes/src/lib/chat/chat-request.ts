import * as z from "zod";

import { userHasPermissions } from "@workspace/api-routes/utils/user-has-permissions.js";
import { User } from "@workspace/server/drizzle/schema.js";
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

export class ChatRequest {
  public readonly id: string; // Chat ID
  public readonly messages: MyUIMessage[];
  public readonly lastMessage: MyUIMessage;
  public readonly filter: Filter | PracticeFilter; // Search filter
  public readonly attachments: { url: string }[]; // Attachments in the last message

  public readonly selectedChatModelId: string;
  public readonly isTemporary: boolean; // Whether to save the chat or not
  public readonly user: User;

  public readonly reasoningEnabled?: boolean;

  constructor(
    id: string,
    messages: MyUIMessage[],
    selectedChatModelId: string,
    isTemporary: boolean,
    user: User,
    reasoningEnabled?: boolean
  ) {
    this.id = id;
    this.messages = messages;
    this.lastMessage = messages[messages.length - 1];

    if (!this.lastMessage.metadata?.filter) {
      throw new HTTPException(400, {
        message: "BAD_REQUEST",
      });
    }

    this.filter = this.lastMessage.metadata.filter;
    this.attachments = this.lastMessage.metadata?.attachments || [];

    this.selectedChatModelId = selectedChatModelId;
    this.isTemporary = isTemporary;
    this.user = user;

    this.reasoningEnabled = reasoningEnabled;
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
      modelId: selectedChatModelId,
      temp: isTemporary,
      reasoning: reasoningEnabled,
      messageCount,
    } = validatedPayload;

    // For practice chats with lastStartMessageIndex, only retrieve messages after that index
    const prevMessages = await getMessagesByChatId({
      chatId: id,
      messageCount: messageCount ? Math.min(messageCount, 12) : 12,
    });

    const messages = [...prevMessages, message];

    console.log("Messages:", messages);

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
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }

    return new ChatRequest(
      id,
      validatedUIMessages,
      selectedChatModelId,
      isTemporary,
      { ...user, image: user.image ?? null },
      reasoningEnabled
    );
  }

  async validatePermissions(): Promise<void> {
    const hasPermission = await userHasPermissions({
      userId: this.user.id,
      filterBucketId: this.filter.bucket.id,
      filterCourseIds: this.filter.courses.map((c) => c.id),
      filterFileIds: this.filter.files.map((f) => f.id),
      filterAttachments: this.attachments,
    });

    if (!hasPermission) {
      throw new HTTPException(403, { message: "FORBIDDEN" });
    }
  }

  validateUserMessage(): void {
    if (this.lastMessage.role !== "user") {
      throw new HTTPException(400, {
        message: "BAD_REQUEST",
      });
    }
  }
}
