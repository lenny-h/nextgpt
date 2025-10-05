import * as z from "zod";
import { tool } from "ai";

export const createMultipleChoiceTool = tool({
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
  execute: async () => ({
    message:
      "The multiple choice question has been created and sent to the user.",
  }),
});
