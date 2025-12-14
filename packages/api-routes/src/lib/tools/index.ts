import * as z from "zod";

import { documentSourceSchema } from "@workspace/api-routes/schemas/document-source-schema.js";
import { tool } from "ai";
import { uuidSchema } from "../../schemas/uuid-schema.js";
import { artifactKindSchema } from "../../types/artifact-kind.js";

export const tools = {
  searchDocuments: tool({
    description: "Retrieves document sources based on keywords and questions",
    inputSchema: z.object({
      keywords: z.array(z.string()),
      questions: z.array(z.string()),
      pageNumbers: z.array(z.number()),
    }),
    outputSchema: z.object({ docSources: z.array(documentSourceSchema) }),
  }),
  searchWeb: tool({
    description: "Retrieves web sources based on a search query.",
    inputSchema: z.object({
      searchTerms: z.string(),
    }),
    outputSchema: z.object({
      webSources: z.array(
        z.object({
          id: uuidSchema,
          url: z.string().optional(),
          title: z.string(),
          description: z.string().optional(),
          content: z.string().optional(),
        })
      ),
    }),
  }),
  scrapeUrl: tool({
    description:
      "Scrape the content of a given URL and return it in markdown format.",
    inputSchema: z.object({
      urlToScrape: z.string(),
    }),
    outputSchema: z.object({ markdown: z.string() }),
  }),
  createDocument: tool({
    description:
      "Call this tool if the user explicitly mentions that they want you to create a new document. Provide the instructions that will be passed to an llm for creating the document. The llm will stream the document to the user.",
    inputSchema: z.object({
      instructions: z.string(),
      documentTitle: z.string(),
      kind: artifactKindSchema,
    }),
    outputSchema: z.object({
      message: z.string(),
      documentId: uuidSchema,
      documentTitle: z.string(),
      kind: artifactKindSchema,
    }),
  }),
  modifyDocument: tool({
    description:
      "Call this tool if the user wants you to modify a document they've appended. Provide the instructions that will be passed to an llm for doing the modifications. The llm will also have access to the document provided by the user. The llm will stream the document to the user.",
    inputSchema: z.object({
      instructions: z.string(),
    }),
    outputSchema: z.object({
      message: z.string(),
      documentId: uuidSchema,
      documentTitle: z.string().min(1).max(128),
      kind: artifactKindSchema,
    }),
  }),
  retrieveRandomDocumentSources: tool({
    description: "Retrieves random document sources",
    inputSchema: z.object({}),
    outputSchema: z.object({ docSources: z.array(documentSourceSchema) }),
  }),
  createMultipleChoice: tool({
    description:
      "Use this tool to create a multiple choice question with four answer choices (A, B, C, D) and indicate the correct answer. The question and answer choices should be clear and concise.",
    inputSchema: z.object({
      question: z.string(),
      choiceA: z.string(),
      choiceB: z.string(),
      choiceC: z.string(),
      choiceD: z.string(),
      correctAnswer: z.enum(["A", "B", "C", "D"]),
    }),
    outputSchema: z.object({ message: z.string() }),
  }),
};
