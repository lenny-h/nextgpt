import * as z from "zod";

import { validateUIMessages } from "ai";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { dataSchemas } from "../../schemas/data-schemas.js";
import { type Filter } from "../../schemas/filter-schema.js";
import { metadataSchema } from "../../schemas/metadata-schema.js";
import { type PracticeFilter } from "../../schemas/practice-filter-schema.js";
import { type MyUIMessage } from "../../types/custom-ui-message.js";
import { tools } from "../tools/index.js";
import { User } from "@workspace/server/drizzle/schema.js";

export class ChatRequest {
  public readonly id: string; // Chat ID
  public readonly messages: MyUIMessage[];
  public readonly lastMessage: MyUIMessage;
  public readonly filter: Filter | PracticeFilter; // Search filter
  public readonly selectedChatModelId: string;
  public readonly isTemporary: boolean; // Whether to save the chat or not
  public readonly reasoningEnabled?: boolean;
  public readonly user: User;

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
        message: "Filter is required in the last message metadata",
      });
    }

    this.filter = this.lastMessage.metadata.filter;
    this.selectedChatModelId = selectedChatModelId;
    this.isTemporary = isTemporary;
    this.reasoningEnabled = reasoningEnabled;
    this.user = user;
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
      messages,
      modelId: selectedChatModelId,
      temp: isTemporary,
      reasoning: reasoningEnabled,
    } = validatedPayload;

    console.log("Messages:", messages);

    const validatedUIMessages = await validateUIMessages<MyUIMessage>({
      messages,
      dataSchemas,
      metadataSchema,
      tools,
    });

    return new ChatRequest(
      id,
      validatedUIMessages,
      selectedChatModelId,
      isTemporary,
      user,
      reasoningEnabled
    );
  }

  async validatePermissions(): Promise<void> {
    const { userHasPermissions } = await import(
      "../../utils/user-has-permissions.js"
    );

    let files = this.filter.files.map((file) =>
      typeof file === "string" ? file : file.id
    );

    for (const message of this.messages) {
      for (const part of message.parts) {
        if (part.type !== "file") {
          continue;
        }

        const expectedPrefix = `gs://${process.env.GOOGLE_VERTEX_PROJECT}-correction-bucket/`;
        const rest = part.url.substring(expectedPrefix.length);

        if (message.role === "user") {
          if (!rest.startsWith(this.user.id)) {
            throw new HTTPException(403, { message: "Forbidden" });
          }
        } else if (message.role === "assistant") {
          const fileId = rest.split("/")[0];
          files.push(fileId);
        }
      }
    }

    const hasPermission = await userHasPermissions({
      userId: this.user.id,
      metadata: (this.user as any).app_metadata, // TODO: fix
      bucketId: this.filter.bucketId,
      courses: this.filter.courses,
      files,
    });

    if (!hasPermission) {
      throw new HTTPException(403, { message: "Forbidden" });
    }
  }

  validateUserMessage(): void {
    if (this.lastMessage.role !== "user") {
      throw new HTTPException(400, {
        message: "Last message must be from user",
      });
    }
  }
}
