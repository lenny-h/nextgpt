import { type ChunkedDoclingResponse } from "../types/docling-response.js";

export interface ProcessedChunk {
  chunkId: string;
  chunkIndex: number;
  content: string;
  chapter: number;
  pageNumber: number;
}

export async function processDocumentWithDocling(
  bucketId: string,
  key: string
): Promise<ChunkedDoclingResponse> {
  const response = await fetch(
    `${process.env.DOCLING_URL}/convert-from-s3?bucketId=${encodeURIComponent(bucketId)}&key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Docling service returned ${response.status}: ${errorText}`
    );
  }

  const doclingResponse: ChunkedDoclingResponse = await response.json();

  if (!doclingResponse.success) {
    throw new Error(`Docling conversion failed: ${doclingResponse.message}`);
  }

  return doclingResponse;
}
