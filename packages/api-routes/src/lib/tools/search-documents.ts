import * as z from "zod";

import { type Tool, tool } from "ai";
import { type Filter } from "../../schemas/filter-schema.js";
import { type PracticeFilter } from "../../schemas/practice-filter-schema.js";
import { createLogger } from "../../utils/logger.js";
import {
  retrieveEmbedding,
  searchDocuments,
} from "../../utils/retrieve-context.js";

const logger = createLogger("retrieve-document-sources-tool");

export const searchDocumentsTool = ({
  filter,
  retrieveContent,
}: {
  filter: Filter | PracticeFilter;
  retrieveContent: boolean;
}): Tool =>
  tool({
    description: "Retrieves document sources based on keywords and questions",
    inputSchema: z.object({
      keywords: z.array(z.string()),
      questions: z.array(z.string()),
      pageNumbers: z.array(z.number()),
    }),
    execute: async ({ keywords, questions, pageNumbers }) => {
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
        return { docSources };
      } catch (error) {
        logger.error("Failed to search documents:", error);
        throw error;
      }
    },
  });
