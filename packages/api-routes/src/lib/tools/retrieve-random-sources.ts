import * as z from "zod";

import { type PracticeFilter } from "@workspace/api-routes/schemas/practice-filter-schema.js";
import { createLogger } from "@workspace/server/logger.js";
import { type Tool, tool } from "ai";
import { type SearchDocumentsOutput } from "../../types/tool-output.js";
import { retrieveRandomChunks } from "../db/queries/chunks.js";

const logger = createLogger("retrieve-random-sources-tool");

export const retrieveRandomDocumentSourcesTool = ({
  filter,
  retrieveContent,
  storeFullContent,
}: {
  filter: PracticeFilter;
  retrieveContent: boolean;
  storeFullContent: (id: string, content: SearchDocumentsOutput) => void;
}): Tool =>
  tool({
    description: "Retrieves random document sources",
    inputSchema: z.object({}),
    execute: async ({ }, { toolCallId }) => {
      logger.debug("Retrieving random document sources");

      try {
        const docSources = await retrieveRandomChunks({
          filter,
          retrieveContent,
        });

        logger.debug("Retrieved random sources:", { count: docSources.length });

        const fullResult = { docSources };

        // Store the full content for the model context
        storeFullContent(toolCallId, fullResult);

        // Return truncated content for the client/DB
        const truncatedDocSources = fullResult.docSources.map((source) => ({
          ...source,
          pageContent: source.pageContent?.slice(0, 20) + "...",
        }));

        return { docSources: truncatedDocSources };
      } catch (error) {
        logger.error("Failed to retrieve random sources:", error);
        throw error;
      }
    },
  });
