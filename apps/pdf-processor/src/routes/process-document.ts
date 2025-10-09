import { randomUUID } from "crypto";
import { type DocumentUploadEvent } from "../types/document-upload-event.js";
import {
  processDocumentWithDocling,
  type ProcessedChunk,
} from "../utils/docling-helper-functions.js";
import { embedContent } from "../utils/gemini-helper-functions.js";
import {
  updateStatusToFailed,
  updateStatusToFinished,
  updateStatusToProcessing,
  uploadToPostgresDb,
} from "../utils/postgres-db.js";
import { deleteFileFromS3 } from "../utils/s3-client.js";

export const processDocument = async (
  data: DocumentUploadEvent
): Promise<void> => {
  const taskId = data.taskId;
  const bucketId = data.bucket;
  const courseId = data.name.split("/")[0];
  const shortenedFilename = data.name.split("/")[1];
  const fileSize = parseInt(data.size);

  try {
    await updateStatusToProcessing(taskId);

    // Process document with Docling (downloads from S3 internally)
    const doclingResponse = await processDocumentWithDocling(
      bucketId,
      data.name
    );

    if (doclingResponse.chunks.length === 0) {
      throw new Error("No content chunks were generated from the document");
    }

    const processedChunks: ProcessedChunk[] = [];

    for (const chunk of doclingResponse.chunks) {
      const chunkId = randomUUID();

      const processedChunk: ProcessedChunk = {
        chunkId,
        chunkIndex: chunk.chunk_index,
        content: chunk.content,
        chapter: 0,
        pageNumber: 0,
      };

      processedChunks.push(processedChunk);
    }

    // Generate embeddings for all chunks
    const embeddings = await embedContent(
      processedChunks.map((chunk) => chunk.content)
    );

    const embeddedChunks = processedChunks.map((chunk, index) => ({
      pageId: chunk.chunkId,
      pageIndex: chunk.chunkIndex,
      embedding: embeddings[index].values as number[],
      content: chunk.content,
      chapter: chunk.chapter,
      pageNumber: chunk.pageNumber,
    }));

    await uploadToPostgresDb(
      taskId,
      courseId,
      shortenedFilename,
      fileSize,
      embeddedChunks
    );

    await updateStatusToFinished(taskId);
  } catch (error) {
    try {
      await deleteFileFromS3(
        `${process.env.GOOGLE_VERTEX_PROJECT}-files-bucket`,
        data.name
      );

      console.log("Cleanup successful");
    } catch (error) {
      console.error("Failed to clean up source file:", error);
    }

    try {
      await updateStatusToFailed(taskId, bucketId);
    } catch (error) {
      console.error("Failed to update task status to failed:", error);
    }

    console.error("Error processing the uploaded file:", error);
    throw error;
  }
};
