import { vertex } from "@ai-sdk/google-vertex";
import { type UIMessageStreamWriter, smoothStream, streamText } from "ai";
import { type MyUIMessage } from "../../types/custom-ui-message.js";
import { createDocumentPrompt, updateDocumentPrompt } from "../prompts.js";

export interface UpdateDocumentProps {
  content: string;
  instructions: string;
  writer: UIMessageStreamWriter<MyUIMessage>;
}

export const documentHandlers = (["text", "code"] as const).map((kind) => ({
  kind,
  onCreateDocument: async ({
    writer,
    instructions,
  }: {
    writer: UIMessageStreamWriter<MyUIMessage>;
    instructions: string;
  }) => {
    let draftContent = "";

    const { fullStream } = streamText({
      system: createDocumentPrompt(kind),
      model: vertex("gemini-2.5-pro"),
      prompt: instructions,
      experimental_transform: smoothStream({ chunking: "line" }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "text-delta") {
        const { text } = delta;

        draftContent += text;
        writer.write({
          type: `data-${kind}-delta`,
          data: text,
          transient: true,
        });
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({
    writer,
    content,
    instructions,
  }: UpdateDocumentProps) => {
    let draftContent = "";

    const { fullStream } = streamText({
      system: updateDocumentPrompt(content, kind),
      model: vertex("gemini-2.5-pro"),
      prompt: instructions,
      experimental_transform: smoothStream({ chunking: "line" }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "text-delta") {
        const { text } = delta;

        draftContent += text;
        writer.write({
          type: `data-${kind}-delta`,
          data: text,
          transient: true,
        });
      }
    }

    return draftContent;
  },
}));
