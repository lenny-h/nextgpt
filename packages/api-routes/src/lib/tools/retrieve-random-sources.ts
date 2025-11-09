import * as z from "zod";

import { type Tool, tool } from "ai";
import { type PracticeFilter } from "../../schemas/practice-filter-schema.js";
import { retrieveRandomSources } from "../db/queries/pages.js";
import { createLogger } from "../../utils/logger.js";

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
        const sources = await retrieveRandomSources({
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
