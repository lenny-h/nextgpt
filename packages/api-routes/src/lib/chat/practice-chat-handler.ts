import { generateUUID } from "@workspace/api-routes/utils/utils.js";
import { createLogger } from "@workspace/server/logger.js";
import {
  stepCountIs,
  streamText,
  type Tool,
  type UIMessageStreamWriter,
} from "ai";
import { type PracticeFilter } from "../../schemas/practice-filter-schema.js";
import { type MyUIMessage } from "../../types/custom-ui-message.js";
import { PRACTICE_SYSTEM_PROMPT } from "../prompts.js";
import { createMultipleChoiceTool } from "../tools/create-multiple-choice.js";
import { retrieveRandomDocumentSourcesTool } from "../tools/retrieve-random-sources.js";
import { searchDocumentsTool } from "../tools/search-documents.js";
import { ChatConfig } from "./chat-config.js";
import { ChatHandler } from "./chat-handler.js";
import { ChatRequest } from "./chat-request.js";

const logger = createLogger("practice-chat-handler");

export class PracticeChatHandler extends ChatHandler {
  private systemPrompt: string = PRACTICE_SYSTEM_PROMPT;

  constructor(request: ChatRequest, config: ChatConfig) {
    super(request, config);
  }

  protected async validateSpecificRequirements(): Promise<void> {
    // No specific requirements for practice chat
  }

  protected async generateChatTitle(): Promise<string> {
    return `Practice session: ${(this.request.filter as PracticeFilter).studyMode}`;
  }

  protected retrieveToolSet(): Record<string, Tool> {
    const tools: Record<string, Tool> = {
      retrieveRandomDocumentSources: retrieveRandomDocumentSourcesTool({
        filter: this.request.filter as PracticeFilter,
        retrieveContent: true,
      }),
      searchDocuments: searchDocumentsTool({
        filter: this.request.filter,
        retrieveContent: true,
      }),
      createMultipleChoice: createMultipleChoiceTool,
    };

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
      tools: this.retrieveToolSet(),
      prepareStep: async ({ stepNumber }) => {
        if (this.request.lastMessage.metadata?.isStartMessage) {
          return {
            activeTools:
              stepNumber === 0
                ? ["retrieveRandomDocumentSources"]
                : stepNumber === 1 &&
                    (this.request.filter as PracticeFilter).studyMode ===
                      "multipleChoice"
                  ? ["createMultipleChoice"]
                  : ["searchDocuments"],
            toolChoice:
              stepNumber === 0
                ? { type: "tool", toolName: "searchDocuments" }
                : stepNumber === 1
                  ? { type: "tool", toolName: "createMultipleChoice" }
                  : "none",
          };
        }

        return {
          activeTools: ["searchDocuments"],
        };
      },
      stopWhen: stepCountIs(3),
    });

    result.consumeStream(); // Consume the stream even if the client disconnects to avoid having unfinished responses

    writer.merge(
      result.toUIMessageStream({
        generateMessageId: generateUUID,
        originalMessages: this.request.messages,
        onFinish: async ({ messages }) => {
          await this.saveResponseMessages(messages);
        },
      })
    );
  }

  protected handleError(error: any): string {
    logger.error("Error in practice route", error);

    return "An error occurred. Please try again later.";
  }
}
