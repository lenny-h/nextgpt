import { type ArtifactKind } from "@workspace/api-routes/types/artifact-kind.js";
import { documentModifierModelIdx } from "@workspace/api-routes/utils/models.js";
import { type UIMessageStreamWriter, smoothStream, streamText } from "ai";
import { type MyUIMessage } from "../../types/custom-ui-message.js";
import { getModel } from "../providers.js";

export interface UpdateDocumentProps {
  content: string;
  instructions: string;
  writer: UIMessageStreamWriter<MyUIMessage>;
}

const createDocumentPrompt = (type: ArtifactKind) =>
  `Create a document of type ${type} based on the instructions given in the prompt. Only return the created document. For math equations, use LaTeX syntax (prefer block equations over inline equations). If you write code, do not enclose it in backticks to signal code; instead, start with the actual code right away.`;

const updateDocumentPrompt = (
  currentContent: string | null,
  type: ArtifactKind
) =>
  `Modify the following document of type ${type} based on the instructions given in the prompt. Only return the modified document. For math equations, use LaTeX syntax (prefer block equations over inline equations. If you write code, do not enclose it in backticks to signal code; instead, start with the actual code right away.\n\n${currentContent}`;

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

    const config = await getModel(documentModifierModelIdx);

    const { fullStream } = streamText({
      system: createDocumentPrompt(kind),
      model: config.model,
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

    const config = await getModel(documentModifierModelIdx);

    const { fullStream } = streamText({
      system: updateDocumentPrompt(content, kind),
      model: config.model,
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
