import * as z from "zod";

import { type Tool, tool } from "ai";
import { type Filter } from "../../schemas/filter-schema.js";
import { type PracticeFilter } from "../../schemas/practice-filter-schema.js";
import {
  retrieveDocumentSources,
  retrieveEmbedding,
} from "../../utils/retrieve-context.js";

export const retrieveDocumentSourcesTool = ({
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
      const embedding = await retrieveEmbedding(questions.join(" "));

      return await retrieveDocumentSources({
        filter,
        retrieveContent,
        embedding,
        ftsQuery: keywords.join(" "),
        pageNumbers,
      });
    },
  });
