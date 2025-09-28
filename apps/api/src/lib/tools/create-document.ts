import { z } from "zod";

import { type UIMessageStreamWriter, tool } from "ai";
import { artifactKindSchema } from "../../types/artifact-kind.js";
import { type MyUIMessage } from "../../types/custom-ui-message.js";
import { generateUUID } from "../../utils/utils.js";
import { documentHandlers } from "./document-handlers.js";

export const createDocumentTool = ({
  writer,
}: {
  writer: UIMessageStreamWriter<MyUIMessage>;
}) =>
  tool({
    description:
      "Call this tool if the user explicitly mentions that they want you to create a new document. Provide the instructions that will be passed to an llm for creating the document. The llm will stream the document to the user.",
    inputSchema: z.object({
      documentTitle: z.string(),
      instructions: z.string(),
      kind: artifactKindSchema,
    }),
    execute: async ({ documentTitle, instructions, kind }) => {
      const documentId = generateUUID();

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

      await documentHandler.onCreateDocument({
        writer,
        instructions,
      });

      writer.write({ type: "finish" });

      return {
        message:
          "The document was created and is now visible to the user. Ask the user if they want any other changes.",
        documentId,
        documentTitle,
        kind,
      };
    },
  });
