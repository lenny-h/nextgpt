import { db } from "@workspace/server/drizzle/db.js";
import { toolCallDocuments } from "@workspace/server/drizzle/schema.js";
import { type UIMessageStreamWriter, tool } from "ai";
import { z } from "zod";
import { type ArtifactKind } from "../../types/artifact-kind.js";
import { type MyUIMessage } from "../../types/custom-ui-message.js";
import { createLogger } from "../../utils/logger.js";
import { documentHandlers } from "./document-handlers.js";

const logger = createLogger("modify-document-tool");

interface ModifyDocumentProps {
  writer: UIMessageStreamWriter<MyUIMessage>;
  documentId: string;
  documentTitle: string;
  userId: string;
  chatId: string;
  content: string;
  kind: ArtifactKind;
}

export const modifyDocumentTool = ({
  writer,
  documentId,
  documentTitle,
  chatId,
  userId,
  content,
  kind,
}: ModifyDocumentProps) =>
  tool({
    description:
      "Call this tool if the user wants you to modify a document they've appended. Provide the instructions that will be passed to an llm for doing the modifications. The llm will also have access to the document provided by the user. The llm will stream the document to the user.",
    inputSchema: z.object({
      instructions: z.string(),
    }),
    execute: async ({ instructions }, { experimental_context: context }) => {
      logger.debug("Modifying document:", { documentId, documentTitle, kind });
      
      const documentHandler = documentHandlers.find(
        (documentHandler) => documentHandler.kind === kind
      );

      if (!documentHandler) {
        logger.error("No document handler found for kind:", kind);
        throw new Error(`No document handler found for kind: ${kind}`);
      }

      const typedContext = context as { writeDeltas: boolean };

      try {
        const draftContent = await documentHandler.onUpdateDocument({
          writer,
          writeDeltas: typedContext.writeDeltas,
          content,
          instructions,
          documentId,
          documentTitle,
        });

        writer.write({ type: "finish" });

        await db.insert(toolCallDocuments).values({
          id: documentId,
          chatId,
          userId,
          title: documentTitle,
          content: draftContent,
          kind,
        });

        logger.debug("Document modified successfully:", { documentId, documentTitle });

        return {
          message:
            "The document was modified and is now visible to the user. Ask the user if they want any other changes.",
          documentId,
          documentTitle,
          kind,
        };
      } catch (error) {
        logger.error("Failed to modify document:", { documentId, documentTitle, kind }, error);
        throw error;
      }
    },
  });
