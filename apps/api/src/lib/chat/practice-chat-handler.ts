import {
  stepCountIs,
  streamText,
  type Tool,
  type UIMessageStreamWriter,
} from "ai";
import { type PracticeFilter } from "../../schemas/practice-filter-schema.js";
import { type MyUIMessage } from "../../types/custom-ui-message.js";
import { type DocumentSource } from "../../types/document-source.js";
import { createMultipleChoiceTool } from "../tools/create-multiple-choice.js";
import { retrieveDocumentSourcesTool } from "../tools/retrieve-document-sources.js";
import { ChatConfig } from "./chat-config.js";
import { ChatHandler } from "./chat-handler.js";
import { ChatRequest } from "./chat-request.js";
import { P_USER_RESPONSE_SYSTEM_PROMPT } from "../prompts.js";

export class PracticeChatHandler extends ChatHandler {
  private systemPrompt: string = P_USER_RESPONSE_SYSTEM_PROMPT;

  constructor(request: ChatRequest, config: ChatConfig) {
    super(request, config);
  }

  protected async validateSpecificRequirements(): Promise<void> {
    // No specific requirements for practice chat
  }

  protected async generateChatTitle(): Promise<string> {
    return "Practice Session";
  }

  protected retrieveToolSet(): Record<string, Tool> {
    const tools: Record<string, Tool> = {
      retrieveDocumentSources: retrieveDocumentSourcesTool({
        filter: this.request.filter,
        retrieveContent: !this.config.isDefaultModel,
      }),
      createMultipleChoice: createMultipleChoiceTool,
    };

    return tools;
  }

  protected async executeChat(
    writer: UIMessageStreamWriter<MyUIMessage>
  ): Promise<void> {
    // const exerciseSources = retrieveRandomSources({
    //   filter: this.request.filter as PracticeFilter,
    //   retrieveContent: !this.config.isDefaultModel,
    // });

    // writer.write({
    //   type: "file",

    // this.request.lastMessage.metadata?.isStartMessage

    const streamConfig = this.createStreamTextConfig({
      systemPrompt: this.systemPrompt,
    });

    const result = streamText({
      ...streamConfig,
      tools: this.retrieveToolSet(),
      prepareStep: async ({ steps, messages, stepNumber }) => {
        console.log("Last message after step:", messages[messages.length - 1]);

        const retrievedDocumentSources = steps[
          steps.length - 1
        ].toolResults.find((r) => r.toolName === "retrieveDocumentSources")
          ?.output.documentSources as DocumentSource[] | undefined;

        if (retrievedDocumentSources && retrievedDocumentSources.length > 0) {
          messages.push({
            role: "user",
            content: [
              {
                type: "text",
                text: "Base your questions on the following sources:\n\n",
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

        if (this.request.lastMessage.metadata?.isStartMessage) {
          return {
            activeTools:
              stepNumber === 0
                ? ["retrieveDocumentSources"]
                : stepNumber === 1 &&
                    (this.request.filter as PracticeFilter).studyMode ===
                      "multipleChoice"
                  ? ["createMultipleChoice"]
                  : [],
            toolChoice:
              stepNumber === 0
                ? { type: "tool", toolName: "retrieveDocumentSources" }
                : stepNumber === 1
                  ? { type: "tool", toolName: "createMultipleChoice" }
                  : "none",
          };
        }

        return {
          activeTools: ["retrieveDocumentSources"],
        };
      },
      stopWhen: stepCountIs(3),
    });

    result.consumeStream(); // Consume the stream even if the client disconnects to avoid having unfinished responses

    writer.merge(
      result.toUIMessageStream({
        originalMessages: this.request.messages,
        onFinish: async ({ messages }) => {
          // console.log(
          //   "Finished chat response. Messages to be saved:",
          //   messages
          // );
          await this.saveResponseMessages(
            messages.splice(0, this.request.messages.length)
          );
        },
      })
    );
  }

  protected handleError(error: any): string {
    console.error("Error in practice route", error);

    if (error instanceof Error && error.message === "Not found") {
      return "Sorry, I couldn't find any course material that matches your request. Do the selected chapters exist?";
    }

    return "An error occurred. Please try again later.";
  }
}
