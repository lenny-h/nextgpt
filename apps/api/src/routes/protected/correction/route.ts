import { vertex } from "@ai-sdk/google-vertex";
import { generateText } from "ai";
import { type Context } from "hono";
import { insertDocument } from "../../../lib/db/queries/documents.js";
import { getPrompt } from "../../../lib/db/queries/prompts.js";
import { CORRECTION_PROMPT } from "../../../lib/prompts.js";
import { correctionSchema } from "./schema.js";

export async function POST(c: Context) {
  const payload = await c.req.json();

  const {
    solutionFilename,
    handInFilenames,
    promptId,
  }: {
    solutionFilename: string;
    handInFilenames: string[];
    promptId?: string;
  } = correctionSchema.parse(payload);

  const user = c.get("user");

  const customPrompt = promptId ? await getPrompt(promptId) : undefined;

  const failedFiles: string[] = [];

  for (const handInFilename of handInFilenames) {
    try {
      const evaluation = await evaluateSubmission(
        solutionFilename,
        handInFilename,
        user.id,
        customPrompt
      );

      await insertDocument({
        userId: user.id,
        title: handInFilename.split("/").pop()?.split(".")[0] + "_eval",
        content: evaluation,
        kind: "text",
      });
    } catch (error) {
      console.error(`Error processing ${handInFilename}:`, error);
      failedFiles.push(handInFilename);
    }
  }

  if (failedFiles.length > 0) {
    return c.json({
      failedFiles,
    });
  }

  return c.json({
    failedFiles: [],
  });
}

async function evaluateSubmission(
  solutionFilename: string,
  handInFilename: string,
  userId: string,
  customPrompt?: string
): Promise<string> {
  let prompt = CORRECTION_PROMPT;

  if (customPrompt) {
    prompt +=
      "\n\nHere are some more custom instructions. Please follow them strictly:\n\n" +
      customPrompt;
  }

  try {
    const { text } = await generateText({
      model: vertex("gemini-2.5-pro"),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "file",
              data: `gs://${process.env.GOOGLE_VERTEX_PROJECT}-correction-bucket/${userId}/${solutionFilename}`,
              mediaType: "application/pdf",
            },
            { type: "text", text: "Solution (above)" },
            {
              type: "file",
              data: `gs://${process.env.GOOGLE_VERTEX_PROJECT}-correction-bucket/${userId}/${handInFilename}`,
              mediaType: "application/pdf",
            },
            { type: "text", text: "Submission (above)" },
          ],
        },
      ],
    });

    return text;
  } catch (error) {
    console.error("Vertex AI evaluation error:", error);
    throw new Error("Failed to evaluate submission");
  }
}
