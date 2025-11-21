import * as z from "zod";

import { type PracticeFilter } from "@workspace/api-routes/schemas/practice-filter-schema.js";
import { createLogger } from "@workspace/server/logger.js";
import { type Tool, tool } from "ai";
import { retrieveRandomChunks } from "../db/queries/chunks.js";

const logger = createLogger("retrieve-random-sources-tool");

export const retrieveRandomDocumentSourcesTool = ({
  filter,
  retrieveContent,
}: {
  filter: PracticeFilter;
  retrieveContent: boolean;
}): Tool =>
  tool({
    description: "Retrieves random document sources",
    inputSchema: z.object({}),
    execute: async ({}) => {
      logger.debug("Retrieving random document sources");

      try {
        const sources = await retrieveRandomChunks({
          filter,
          retrieveContent,
        });

        logger.debug("Retrieved random sources:", { count: sources.length });
        return sources;
      } catch (error) {
        logger.error("Failed to retrieve random sources:", error);
        throw error;
      }
    },
  });
