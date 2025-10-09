import * as z from "zod";

import { documentSourceSchema } from "@workspace/api-routes/schemas/document-source-schema.js";
import { tool } from "ai";
import { uuidSchema } from "../../schemas/uuid-schema.js";
import { artifactKindSchema } from "../../types/artifact-kind.js";

export const tools = {
  retrieveDocumentSources: tool({
    description: "Retrieves document sources based on keywords and questions",
    inputSchema: z.object({
      keywords: z.array(z.string()),
      questions: z.array(z.string()),
      pageNumbers: z.array(z.number()),
    }),
    outputSchema: z.object({ documentSources: z.array(documentSourceSchema) }),
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
