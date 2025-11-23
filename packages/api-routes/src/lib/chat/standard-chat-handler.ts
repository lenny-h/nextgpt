import { generateTitleFromUserMessage } from "@workspace/api-routes/utils/generate-title.js";
import { chatTitleModelIdx } from "@workspace/api-routes/utils/models.js";
import { generateUUID } from "@workspace/api-routes/utils/utils.js";
import { type CustomDocument } from "@workspace/server/drizzle/schema.js";
import { createLogger } from "@workspace/server/logger.js";
import {
  stepCountIs,
  streamText,
  type Tool,
  type UIMessageStreamWriter,
} from "ai";
import { type MyUIMessage } from "../../types/custom-ui-message.js";
import { type ToolOutput } from "../../types/tool-output.js";
import { getPromptsByIds } from "../db/queries/prompts.js";
import { STANDARD_SYSTEM_PROMPT } from "../prompts.js";
import { getModel } from "../providers.js";
import { createDocumentTool } from "../tools/create-document.js";
import { modifyDocumentTool } from "../tools/modify-document.js";
import { createScrapeUrlTool } from "../tools/scrape-url.js";
import { searchDocumentsTool } from "../tools/search-documents.js";
import { createSearchWebTool } from "../tools/search-web.js";
import { ChatConfig } from "./chat-config.js";
import { ChatHandler } from "./chat-handler.js";
import { ChatRequest } from "./chat-request.js";

const logger = createLogger("standard-chat-handler");

export class StandardChatHandler extends ChatHandler {
  private systemPrompt: string = STANDARD_SYSTEM_PROMPT;
  private document?: CustomDocument;
  private fullToolContent = new Map<string, ToolOutput>();

  constructor(request: ChatRequest, config: ChatConfig) {
    super(request, config);
  }

  protected async validateSpecificRequirements(): Promise<void> {
    // No specific requirements for standard chat
  }

  private async buildSystemPrompt(): Promise<string> {
    let finalPrompt = this.systemPrompt;

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

          logger.info(
            "Added custom prompts to system prompt. Final system prompt:\n\n",
            finalPrompt
          );
        }
      }
    }

    return finalPrompt;
  }

  protected async generateChatTitle(): Promise<string> {
    const config = await getModel(chatTitleModelIdx);

    logger.debug("Generating chat title with model", {
      chatId: this.request.id,
      model: config.model.toString(),
    });

    return await generateTitleFromUserMessage({
      message: this.request.lastMessage,
      model: config.model,
    });
  }

  protected retrieveToolSet(
    writer: UIMessageStreamWriter<MyUIMessage>
  ): Record<string, Tool> {
    const storeFullContent = (id: string, content: ToolOutput) => {
      this.fullToolContent.set(id, content);
    };

    const tools: Record<string, Tool> = {
      searchDocuments: searchDocumentsTool({
        filter: this.request.filter,
        retrieveContent: true, // Always retrieve content to pass as context to the model
        storeFullContent,
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

    if (process.env.USE_FIRECRAWL === "true" && this.request.webSearchEnabled) {
      tools.scrapeUrl = createScrapeUrlTool({ storeFullContent });
      tools.searchWeb = createSearchWebTool({ storeFullContent });
    }

    return tools;
  }

  protected async executeChat(
    writer: UIMessageStreamWriter<MyUIMessage>
  ): Promise<void> {
    const systemPrompt = await this.buildSystemPrompt();

    const streamConfig = await this.createStreamTextConfig({
      systemPrompt,
    });

    const tools = this.retrieveToolSet(writer);
    const experimental_context = { writeDeltas: true };

    logger.info("Executing chat with tools:", Object.keys(tools));

    const result = streamText({
      ...streamConfig,
      tools,
      experimental_context,
      prepareStep: ({ steps }) => {
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
        return undefined;
      },
      onStepFinish: (step) => {
        logger.info("Step finished:", {
          text: step.text,
          reasoning: step.reasoning,
          toolCalls: step.toolCalls,
        });
        if (
          step.toolCalls.some(
            (call) =>
              call.toolName === "createDocument" ||
              call.toolName === "modifyDocument"
          )
        ) {
          logger.debug("Disabling delta writes for document operations", {
            chatId: this.request.id,
          });
          experimental_context.writeDeltas = false;
        }
      },
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
        messageMetadata: ({ part }) => {
          // Send total usage when generation is finished
          if (part.type === "finish") {
            return { totalUsage: part.totalUsage };
          }
        },
        sendReasoning: true,
      })
    );
  }

  protected handleError(error: any): string {
    logger.error("Error in chat route", error);

    return "An error occurred. Please try again later.";
  }
}
