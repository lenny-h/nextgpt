import { vertex } from "@ai-sdk/google-vertex";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type Tool,
  type UIMessageStreamWriter,
} from "ai";
import { HTTPException } from "hono/http-exception";
import { type Filter } from "../../schemas/filter-schema.js";
import { type MyUIMessage } from "../../types/custom-ui-message.js";
import { type DocumentSource } from "../../types/document-source.js";
import { getDocument } from "../db/queries/documents.js";
import { modifyDocumentTool } from "../tools/modify-document.js";
import { retrieveDocumentSourcesTool } from "../tools/retrieve-document-sources.js";
import { ChatConfig } from "./chat-config.js";
import { ChatHandler } from "./chat-handler.js";
import { ChatRequest } from "./chat-request.js";
import { generateUUID } from "../../utils/utils.js";
import { USER_RESPONSE_SYSTEM_PROMPT } from "../prompts.js";

export class StandardChatHandler extends ChatHandler {
  private systemPrompt: string = USER_RESPONSE_SYSTEM_PROMPT;
  private document?: any;

  constructor(request: ChatRequest, config: ChatConfig) {
    super(request, config);
  }

  protected async validateSpecificRequirements(): Promise<void> {
    const filter = this.request.filter as Filter;

    if (filter.documents?.length) {
      this.document = await getDocument({
        id: filter.documents[0],
      });

      if (this.document && this.request.user.id !== this.document.user_id) {
        throw new HTTPException(403, { message: "Forbidden" });
      }
    }
  }

  protected async generateChatTitle(): Promise<string> {
    const { generateTitleFromUserMessage } = await import(
      "../../utils/generate-title.js"
    );

    return await generateTitleFromUserMessage({
      message: this.request.lastMessage,
      model: vertex("gemini-2.0-flash-001"),
    });
  }

  protected retrieveToolSet(
    writer: UIMessageStreamWriter<MyUIMessage>
  ): Record<string, Tool> {
    const tools: Record<string, Tool> = {
      retrieveDocumentSources: retrieveDocumentSourcesTool({
        filter: this.request.filter,
        retrieveContent: !this.config.isDefaultModel,
      }),
    };

    if (this.document) {
      tools.modifyDocument = modifyDocumentTool({
        writer,
        documentId: this.document.id,
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
    const streamConfig = this.createStreamTextConfig({
      systemPrompt: this.systemPrompt,
    });

    const result = streamText({
      ...streamConfig,
      tools: this.retrieveToolSet(writer),
      prepareStep: async ({ steps, messages }) => {
        console.log("Steps so far:", steps);

        if (steps.length === 0) {
          return undefined;
        }

        const retrievedDocumentSources = steps[
          steps.length - 1
        ].toolResults.find((r) => r.toolName === "retrieveDocumentSources")
          ?.output.documentSources as DocumentSource[] | undefined;

        console.log("Retrieved document sources:", retrievedDocumentSources);

        if (retrievedDocumentSources && retrievedDocumentSources.length > 0) {
          messages.push({
            role: "user",
            content: [
              {
                type: "text",
                text: "The following documents were identified as being relevant context for answering the user query:",
              },
              ...retrievedDocumentSources.map(
                (src) =>
                  ({
                    type: "file",
                    data: `gs://${process.env.GOOGLE_VERTEX_PROJECT}-pages-bucket/${src.fileId}/${src.id}.pdf`,
                    mediaType: "application/pdf",
                  }) as const
              ),
            ],
          });
        }

        return undefined;
      },
      stopWhen: stepCountIs(4),
    });

    result.consumeStream(); // Consume the stream even if the client disconnects to avoid having unfinished responses

    writer.merge(
      result.toUIMessageStream({
        generateMessageId: generateUUID,
        onFinish: async ({ messages }) => {
          // console.log(
          //   "Finished chat response. Messages to be saved:",
          //   messages.splice(0, this.request.messages.length)
          // );
          await this.saveResponseMessages(
            messages.splice(0, this.request.messages.length)
          );
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
