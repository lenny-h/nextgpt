import { z } from "zod";

import { db } from "@workspace/server/drizzle/db.js";
import { toolCallDocuments } from "@workspace/server/drizzle/schema.js";
import { type UIMessageStreamWriter, tool } from "ai";
import { artifactKindSchema } from "../../types/artifact-kind.js";
import { type MyUIMessage } from "../../types/custom-ui-message.js";
import { generateUUID } from "../../utils/utils.js";
import { documentHandlers } from "./document-handlers.js";

interface CreateDocumentProps {
  writer: UIMessageStreamWriter<MyUIMessage>;
  userId: string;
  chatId: string;
}

export const createDocumentTool = ({
  writer,
  chatId,
  userId,
}: CreateDocumentProps) =>
  tool({
    description:
      "Call this tool if the user explicitly mentions that they want you to create a new document. Provide the instructions that will be passed to an llm for creating the document. The llm will stream the document to the user.",
    inputSchema: z.object({
      instructions: z.string(),
      documentTitle: z.string(),
      kind: artifactKindSchema,
    }),
    execute: async (
      { documentTitle, instructions, kind },
      { experimental_context: context }
    ) => {
      const documentId = generateUUID();

      const documentHandler = documentHandlers.find(
        (documentHandler) => documentHandler.kind === kind
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${kind}`);
      }

      const typedContext = context as { writeDeltas: boolean };

      const draftContent = await documentHandler.onCreateDocument({
        writer,
        writeDeltas: typedContext.writeDeltas,
        instructions,
        documentId,
        documentTitle,
      });

      await db.insert(toolCallDocuments).values({
        id: documentId,
        chatId,
        userId,
        title: documentTitle,
        content: draftContent,
        kind,
      });

      return {
        message:
          "The document was created and is now visible to the user. Ask the user if they want any other changes.",
        documentId,
        documentTitle,
        kind,
      };
    },
  });
