import { generateTitleFromUserMessage } from "@workspace/api-routes/utils/generate-title.js";
import { chatTitleModelIdx } from "@workspace/api-routes/utils/models.js";
import { generateUUID } from "@workspace/api-routes/utils/utils.js";
import { CustomDocument } from "@workspace/server/drizzle/schema.js";
import {
  stepCountIs,
  streamText,
  type Tool,
  type UIMessageStreamWriter,
} from "ai";
import { HTTPException } from "hono/http-exception";
import { type Filter } from "../../schemas/filter-schema.js";
import { type MyUIMessage } from "../../types/custom-ui-message.js";
import { getDocument } from "../db/queries/documents.js";
import { STANDARD_SYSTEM_PROMPT } from "../prompts.js";
import { getModel } from "../providers.js";
import { createDocumentTool } from "../tools/create-document.js";
import { modifyDocumentTool } from "../tools/modify-document.js";
import { retrieveDocumentSourcesTool } from "../tools/retrieve-document-sources.js";
import { ChatConfig } from "./chat-config.js";
import { ChatHandler } from "./chat-handler.js";
import { ChatRequest } from "./chat-request.js";

export class StandardChatHandler extends ChatHandler {
  private systemPrompt: string = STANDARD_SYSTEM_PROMPT;
  private document?: CustomDocument;

  constructor(request: ChatRequest, config: ChatConfig) {
    super(request, config);
  }

  protected async validateSpecificRequirements(): Promise<void> {
    const filter = this.request.filter as Filter;

    if (filter.documents?.length) {
      this.document = await getDocument({
        id: filter.documents[0].id,
      });

      if (this.document && this.request.user.id !== this.document.userId) {
        throw new HTTPException(403, { message: "FORBIDDEN" });
      }
    }
  }

  protected async generateChatTitle(): Promise<string> {
    const config = await getModel(chatTitleModelIdx);

    return await generateTitleFromUserMessage({
      message: this.request.lastMessage,
      model: config.model,
    });
  }

  protected retrieveToolSet(
    writer: UIMessageStreamWriter<MyUIMessage>
  ): Record<string, Tool> {
    const tools: Record<string, Tool> = {
      retrieveDocumentSources: retrieveDocumentSourcesTool({
        filter: this.request.filter,
        retrieveContent: true, // Always retrieve content to pass as context to the model
      }),
      createDocument: createDocumentTool({
        writer,
        chatId: this.request.id,
        userId: this.request.user.id,
      }),
    };

    if (this.document) {
      tools.modifyDocument = modifyDocumentTool({
        writer,
        documentId: this.document.id,
        chatId: this.request.id,
        userId: this.request.user.id,
        documentTitle: this.document.title,
        content: this.document.content,
        kind: this.document.kind,
      });
    }

    return tools;
  }

  protected async executeChat(
    writer: UIMessageStreamWriter<MyUIMessage>
  ): Promise<void> {
    const streamConfig = await this.createStreamTextConfig({
      systemPrompt: this.systemPrompt,
    });

    const result = streamText({
      ...streamConfig,
      tools: this.retrieveToolSet(writer),
      stopWhen: stepCountIs(6),
    });

    result.consumeStream(); // Consume the stream even if the client disconnects to avoid having unfinished responses

    writer.merge(
      result.toUIMessageStream({
        generateMessageId: generateUUID,
        originalMessages: this.request.messages,
        onFinish: async ({ messages }) => {
          await this.saveResponseMessages(messages);
        },
        sendReasoning: true,
      })
    );
  }

  protected handleError(error: any): string {
    console.error("Error in chat route", error);

    return "An error occurred. Please try again later.";
  }
}
