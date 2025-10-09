import { randomUUID } from "crypto";
import { PDFDocument } from "pdf-lib";
import { type DocumentUploadEvent } from "../types/document-upload-event.js";
import { type ExtendedGeminiResponse } from "../types/gemini-response.js";
import {
  embedContent,
  processPageWithGemini,
} from "../utils/gemini-helper-functions.js";
import {
  updateStatusToFailed,
  updateStatusToFinished,
  updateStatusToProcessing,
  uploadToPostgresDb,
} from "../utils/postgres-db.js";
import { deleteFileFromS3, downloadFromS3 } from "../utils/s3-client.js";

export const processPdf = async (data: DocumentUploadEvent): Promise<void> => {
  const taskId = data.taskId;
  const bucketId = data.bucket;
  const courseId = data.name.split("/")[0];
  const shortenedFilename = data.name.split("/")[1];
  const fileSize = parseInt(data.size);

  try {
    await updateStatusToProcessing(taskId);

    const pdfBytes = await downloadFromS3(
      `${process.env.GOOGLE_VERTEX_PROJECT}-files-bucket`,
      data.name
    );

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const totalPages = pdfDoc.getPageCount();

    if (totalPages > 250) {
      throw new Error(
        `PDF has too many pages (${totalPages}). Maximum allowed is 250.`
      );
    }

    let prevPageNumber = 0;
    let prevChapter = 0;

    const processedPages: ExtendedGeminiResponse[] = [];

    // Process each page individually
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const singlePageDoc = await PDFDocument.create();
      const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [pageIndex]);

      singlePageDoc.addPage(copiedPage);
      const singlePageBytes = await singlePageDoc.save();

      const pageData = await processPageWithGemini(singlePageBytes);

      if (!pageData.isContentPage) {
        continue;
      }

      if (pageData.pageNumber) {
        prevPageNumber = pageData.pageNumber;
      } else if (prevPageNumber) {
        pageData.pageNumber = prevPageNumber + 1;
      }

      if (pageData.chapter) {
        prevChapter = pageData.chapter;
      } else if (prevChapter) {
        pageData.chapter = prevChapter;
      }

      const extendedPageData: ExtendedGeminiResponse = {
        pageId: randomUUID(),
        pageIndex,
        ...pageData,
      };
      processedPages.push(extendedPageData);
    }

    const embeddings = await embedContent(
      processedPages.map((page) => page.content)
    );

    const embeddedPages = processedPages.map((page, index) => ({
      pageId: page.pageId,
      pageIndex: page.pageIndex,
      embedding: embeddings[index].values as number[],
      content: page.content,
      chapter: page.chapter,
      pageNumber: page.pageNumber,
    }));

    await uploadToPostgresDb(
      taskId,
      courseId,
      shortenedFilename,
      fileSize,
      embeddedPages
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
