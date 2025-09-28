import { type ContentEmbedding, GoogleGenAI, Type } from "@google/genai";

export interface GeminiResponse {
  isContentPage: boolean;
  summary: string;
  content: string;
  chapter: number;
  pageNumber: number;
}

export interface ExtendedGeminiResponse extends GeminiResponse {
  pageId: string;
  pageIndex: number;
}

const genAI = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_VERTEX_PROJECT,
  location: process.env.GOOGLE_VERTEX_LOCATION,
});

export async function processPageWithGemini(
  pageBytes: Uint8Array
): Promise<GeminiResponse> {
  async function attemptProcessing(): Promise<GeminiResponse> {
    const contents = [
      {
        text: `Extract all text content from the given page. Generate a JSON object that contains the following fields: isContentPage, summary, content, chapter, pageNumber. If the given page is empty, a title or cover page, or (part of) table of contents, set isContentPage to false. In this case, summary and content can be left empty.`,
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
            summary: {
              type: Type.STRING,
              description:
                "A summary of the content. Replace images, tables with a description of the content. Equations should be written down in LaTeX format and described in the summary.",
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
          required: [
            "isContentPage",
            "summary",
            "content",
            "chapter",
            "pageNumber",
          ],
        },
      },
    });

    if (!response.text) {
      throw new Error("No response text from GenAI");
    }

    return JSON.parse(response.text);
  }

  try {
    return await attemptProcessing();
  } catch (error) {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // retry after 1 second delay
    return await attemptProcessing();
  }
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
