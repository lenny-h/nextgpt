import * as z from "zod";

import { type Filter } from "@workspace/api-routes/schemas/filter-schema.js";
import { type PracticeFilter } from "@workspace/api-routes/schemas/practice-filter-schema.js";
import { createLogger } from "@workspace/server/logger.js";
import { type Tool, tool } from "ai";
import { type SearchDocumentsOutput } from "../../types/tool-output.js";
import {
  retrieveEmbedding,
  searchDocuments,
} from "../../utils/retrieve-context.js";

const logger = createLogger("retrieve-document-sources-tool");

export const searchDocumentsTool = ({
  filter,
  retrieveContent,
  storeFullContent,
}: {
  filter: Filter | PracticeFilter;
  retrieveContent: boolean;
  storeFullContent: (id: string, content: SearchDocumentsOutput) => void;
}): Tool =>
  tool({
    description: "Retrieves document sources based on keywords and questions",
    inputSchema: z.object({
      keywords: z.array(z.string()),
      questions: z.array(z.string()),
      pageNumbers: z.array(z.number()),
    }),
    execute: async ({ keywords, questions, pageNumbers }, { toolCallId }) => {
      logger.debug("Retrieving document sources:", {
        keywordsCount: keywords.length,
        questionsCount: questions.length,
        pageNumbersCount: pageNumbers.length,
      });

      try {
        let embedding;

        if (questions.length > 0) {
          embedding = await retrieveEmbedding(questions.join(" "));
        }

        const docSources = await searchDocuments({
          filter,
          retrieveContent,
          embedding,
          ftsQuery: keywords.join(" "),
          pageNumbers,
        });

        logger.debug("Retrieved document sources:", {
          count: docSources.length,
        });

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
        logger.error("Failed to search documents:", error);
        throw error;
      }
    },
  });
