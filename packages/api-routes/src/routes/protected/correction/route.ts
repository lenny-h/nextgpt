import { insertDocument } from "@workspace/api-routes/lib/db/queries/documents.js";
import { getPrompt } from "@workspace/api-routes/lib/db/queries/prompts.js";
import { getModel } from "@workspace/api-routes/lib/providers.js";
import { getStorageClient } from "@workspace/api-routes/utils/access-clients/storage-client.js";
import { studentEvaluationModelIdx } from "@workspace/api-routes/utils/models.js";
import { generateText } from "ai";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { correctionSchema } from "./schema.js";

const CORRECTION_PROMPT = `You are a helpful assistant for evaluating student submissions.
I'm providing a solution sheet (marked as SOLUTION) and a student submission (marked as SUBMISSION).

Please evaluate the student work by:
1. Identifying what the student did correctly
2. Pointing out any mistakes or misunderstandings. Elaborate what is incorrect and why. Correct the mistakes.
3. Providing a fair assessment of the overall quality of the submission

Format your response as a structured evaluation that could be shared with the student. Use LaTeX syntax for writing math equations. Do not start with an introduction, just dive into the evaluation.`;

const app = new Hono().post(
  "/",
  validator("json", async (value) => {
    return correctionSchema.parse(value);
  }),
  async (c) => {
    const {
      solutionFilename,
      handInFilenames,
      promptId,
    }: {
      solutionFilename: string;
      handInFilenames: string[];
      promptId?: string;
    } = c.req.valid("json");

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
      return c.json(failedFiles);
    }

    return c.json([]);
  }
);

export default app;

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

  const config = await getModel(studentEvaluationModelIdx);

  const storageClient = getStorageClient();

  const solutionContent = await storageClient.downloadFile({
    bucket: "temporary-files-bucket",
    key: `${userId}/${solutionFilename}`,
  });

  const handInContent = await storageClient.downloadFile({
    bucket: "temporary-files-bucket",
    key: `${userId}/${handInFilename}`,
  });

  try {
    const { text } = await generateText({
      system: prompt,
      model: config.model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Solution:" },
            {
              type: "file",
              data: solutionContent,
              mediaType: "application/pdf",
            },
            { type: "text", text: "Submission:" },
            {
              type: "file",
              data: handInContent,
              mediaType: "application/pdf",
            },
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
