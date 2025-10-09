import { type ContentEmbedding, GoogleGenAI, Type } from "@google/genai";
import { GeminiResponse } from "../types/gemini-response.js";

const genAI = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_VERTEX_PROJECT,
  location: process.env.GOOGLE_VERTEX_LOCATION,
});

async function attemptProcessing(
  pageBytes: Uint8Array
): Promise<GeminiResponse> {
  const contents = [
    {
      text: `Extract all text content from the given page. Generate a JSON object that contains the following fields: isContentPage, content, chapter, pageNumber. If the given page is empty, a title or cover page, or (part of) table of contents, set isContentPage to false. In this case, content can be left empty. Make sure that the content is readable; tables and images should be described in text form (full sentences).`,
    },
    {
      inlineData: {
        mimeType: "application/pdf",
        data: Buffer.from(pageBytes).toString("base64"),
      },
    },
  ];

  const response = await genAI.models.generateContent({
    model: "gemini-2.0-flash",
    contents: contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isContentPage: {
            type: Type.BOOLEAN,
            description:
              "True if the page is a content page. False if the page is a title page, cover page, or part of table of contents.",
            nullable: false,
          },
          content: {
            type: Type.STRING,
            description:
              "The text content of the page. Replace images, tables with a description of the content. Equations should be written down in LaTeX format.",
            nullable: false,
          },
          chapter: {
            type: Type.NUMBER,
            description:
              "The chapter number of the content. If the chapter number is not available or a roman numeral, set this to 0.",
            nullable: false,
          },
          pageNumber: {
            type: Type.NUMBER,
            description:
              "The page number of the content. If the page number is not available or a roman numeral, set this to 0.",
            nullable: false,
          },
        },
        required: ["isContentPage", "content", "chapter", "pageNumber"],
      },
    },
  });

  if (!response.text) {
    throw new Error("No response text from GenAI");
  }

  return JSON.parse(response.text);
}

export async function processPageWithGemini(
  pageBytes: Uint8Array
): Promise<GeminiResponse> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await attemptProcessing(pageBytes);
    } catch (err) {
      lastError = err;
      if (attempt < 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds before retrying
      }
    }
  }

  // If we reach here, all attempts failed — rethrow the last error.
  throw lastError;
}

export async function embedContent(
  contents: string[]
): Promise<ContentEmbedding[]> {
  const response = await genAI.models.embedContent({
    model: process.env.EMBEDDINGS_MODEL!,
    contents,
    config: {
      taskType: "QUESTION_ANSWERING",
    },
  });

  if (!response.embeddings || response.embeddings.length === 0) {
    throw new Error("No response embeddings from GenAI");
  }

  return response.embeddings;
}
