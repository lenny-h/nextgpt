import { createLogger } from "@workspace/server/logger.js";
import { tool } from "ai";
import * as z from "zod";

const logger = createLogger("create-multiple-choice-tool");

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
  execute: async ({ question, correctAnswer }) => {
    logger.debug("Creating multiple choice question:", {
      question,
      correctAnswer,
    });

    return {
      message:
        "The multiple choice question has been created and sent to the user.",
    };
  },
});
