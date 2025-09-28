import { type UIMessageStreamWriter, tool } from "ai";
import { z } from "zod";
import { type ArtifactKind } from "../../types/artifact-kind.js";
import { type MyUIMessage } from "../../types/custom-ui-message.js";
import { documentHandlers } from "./document-handlers.js";

interface ModifyDocumentProps {
  writer: UIMessageStreamWriter<MyUIMessage>;
  documentId: string;
  documentTitle: string;
  content: string;
  kind: ArtifactKind;
}

export const modifyDocumentTool = ({
  writer,
  documentId,
  documentTitle,
  content,
  kind,
}: ModifyDocumentProps) =>
  tool({
    description:
      "Call this tool if the user wants you to modify a document they've appended. Provide the instructions that will be passed to an llm for doing the modifications. The llm will also have access to the document provided by the user. The llm will stream the document to the user.",
    inputSchema: z.object({
      instructions: z.string(),
    }),
    execute: async ({ instructions }) => {
      writer.write({
        type: "data-kind",
        data: {
          id: documentId,
          title: documentTitle,
          kind,
        },
        transient: true,
      });

      const documentHandler = documentHandlers.find(
        (documentHandler) => documentHandler.kind === kind
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${kind}`);
      }

      await documentHandler.onUpdateDocument({
        writer,
        content,
        instructions,
      });

      writer.write({ type: "finish" });

      return {
        message:
          "The document was modified and is now visible to the user. Ask the user if they want any other changes.",
        documentId,
        documentTitle,
        kind,
      };
    },
  });
