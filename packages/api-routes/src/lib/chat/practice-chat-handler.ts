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
import { type ToolOutput } from "../../types/tool-output.js";
import { getPracticeSystemPrompt } from "../prompts.js";
import { createMultipleChoiceTool } from "../tools/create-multiple-choice.js";
import { retrieveRandomDocumentSourcesTool } from "../tools/retrieve-random-sources.js";
import { searchDocumentsTool } from "../tools/search-documents.js";
import { ChatConfig } from "./chat-config.js";
import { ChatHandler } from "./chat-handler.js";
import { ChatRequest } from "./chat-request.js";

const logger = createLogger("practice-chat-handler");

export class PracticeChatHandler extends ChatHandler {
  private fullToolContent = new Map<string, ToolOutput>();

  constructor(request: ChatRequest, config: ChatConfig) {
    super(request, config);
  }

  protected async validateSpecificRequirements(): Promise<void> {
    // No specific requirements for practice chat
  }

  protected async generateChatTitle(): Promise<string> {
    return `Practice Session: ${(this.request.filter as PracticeFilter).studyMode}`;
  }

  private async buildSystemPrompt(): Promise<string> {
    const studyMode = (this.request.filter as PracticeFilter).studyMode;
    const baseSystemPrompt = getPracticeSystemPrompt(studyMode);
    const finalPrompt = await this.buildBaseSystemPrompt(baseSystemPrompt);

    logger.info("Final system prompt:\n\n", finalPrompt);

    return finalPrompt;
  }

  protected retrieveToolSet(): Record<string, Tool> {
    const storeFullContent = (id: string, content: ToolOutput) => {
      this.fullToolContent.set(id, content);
    };

    const tools: Record<string, Tool> = {
      retrieveRandomDocumentSources: retrieveRandomDocumentSourcesTool({
        filter: this.request.filter as PracticeFilter,
        retrieveContent: true, // Always retrieve content to pass as context to the model
        storeFullContent,
      }),
      searchDocuments: searchDocumentsTool({
        filter: this.request.filter,
        retrieveContent: true, // Always retrieve content to pass as context to the model
        storeFullContent,
      }),
      createMultipleChoice: createMultipleChoiceTool,
    };

    return tools;
  }

  protected async executeChat(
    writer: UIMessageStreamWriter<MyUIMessage>
  ): Promise<void> {
    const systemPrompt = await this.buildSystemPrompt();
    const streamConfig = await this.createStreamTextConfig({
      systemPrompt,
    });

    const result = streamText({
      ...streamConfig,
      tools: this.retrieveToolSet(),
      prepareStep: async ({ stepNumber, steps }) => {
        // Re-hydrate the tool results with the full content for the model context
        for (const step of steps) {
          for (const toolCall of step.toolCalls) {
            if (this.fullToolContent.has(toolCall.toolCallId)) {
              const fullContent = this.fullToolContent.get(toolCall.toolCallId);
              const toolResult = step.toolResults.find(
                (tr) => tr.toolCallId === toolCall.toolCallId
              );

              if (toolResult) {
                // Replace the output with the full content
                toolResult.output = fullContent;
              }
            }
          }
        }

        logger.debug(
          "Tool results so far (after re-hydration): ",
          steps.map((s) => s.toolResults)
        );

        if (this.request.lastMessage.metadata?.isStartMessage) {
          const isMultipleChoice =
            (this.request.filter as PracticeFilter).studyMode ===
            "multipleChoice";

          return {
            activeTools:
              stepNumber === 0
                ? ["retrieveRandomDocumentSources"]
                : stepNumber === 1 && isMultipleChoice
                  ? ["createMultipleChoice"]
                  : [],
            toolChoice:
              stepNumber === 0
                ? { type: "tool", toolName: "retrieveRandomDocumentSources" }
                : stepNumber === 1 && isMultipleChoice
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
        onFinish: async ({ responseMessage }) => {
          await this.saveResponseMessages([responseMessage]);
        },
        messageMetadata: ({ part }) => {
          // Send total usage when generation is finished
          if (part.type === "finish") {
            return { totalUsage: part.totalUsage };
          }
        },
      })
    );
  }

  protected handleError(error: any): string {
    logger.error("Error in practice route", error);

    return "An error occurred. Please try again later.";
  }
}
