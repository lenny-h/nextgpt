import { db } from "@workspace/server/drizzle/db.js";
import {
  buckets,
  courses,
  files,
  pages,
  tasks,
} from "@workspace/server/drizzle/schema.js";
import { eq, sql } from "drizzle-orm";

interface EmbeddedPage {
  pageId: string;
  pageIndex: number;
  embedding: number[];
  content: string;
  chapter: number;
  pageNumber: number;
}

const CHUNK_SIZE = 100;

export const uploadToPostgresDb = async (
  taskId: string,
  courseId: string,
  filename: string,
  fileSize: number,
  processedPages: EmbeddedPage[]
) => {
  let insertedFileId: string | null = null;

  try {
    const courseData = await db
      .select({ name: courses.name })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!courseData.length) {
      throw new Error("Course not found");
    }

    await db.insert(files).values({
      id: taskId,
      courseId: courseId,
      name: filename,
      size: fileSize,
    });

    insertedFileId = taskId;

    // Process pages in chunks
    for (let i = 0; i < processedPages.length; i += CHUNK_SIZE) {
      const chunk = processedPages.slice(i, i + CHUNK_SIZE);
      const pagesToInsert = chunk.map((pageData) => {
        const chapter = parseInt(pageData.chapter.toString().split(".")[0]);
        const subChapter = parseInt(
          pageData.chapter.toString().split(".")[1] || "0"
        );

        return {
          id: pageData.pageId,
          fileId: insertedFileId!,
          fileName: filename,
          courseId: courseId,
          courseName: courseData[0].name,
          embedding: pageData.embedding,
          content: pageData.content,
          pageIndex: pageData.pageIndex,
          ...(pageData.pageNumber !== 0 &&
            Number.isInteger(pageData.pageNumber) && {
              pageNumber: pageData.pageNumber,
            }),
          ...(chapter !== 0 && { chapter }),
          ...(subChapter !== 0 && { subChapter: subChapter }),
        };
      });

      await db.insert(pages).values(pagesToInsert);
    }
  } catch (error) {
    // Cleanup on failure
    if (insertedFileId) {
      // Delete all pages associated with this file
      await db.delete(pages).where(eq(pages.fileId, insertedFileId));

      // Delete the file
      await db.delete(files).where(eq(files.id, insertedFileId));
    }
    throw error;
  }
};

export const updateStatusToProcessing = async (taskId: string) => {
  await db
    .update(tasks)
    .set({ status: "processing" })
    .where(eq(tasks.id, taskId));
};

export const updateStatusToFailed = async (
  taskId: string,
  bucketId: string
) => {
  await db.transaction(async (tx) => {
    // Update task status to failed
    await tx
      .update(tasks)
      .set({ status: "failed" })
      .where(eq(tasks.id, taskId));

    // Update bucket size by subtracting the file size
    await tx
      .update(buckets)
      .set({
        size: sql`size - (SELECT file_size FROM tasks WHERE id = ${taskId})`,
      })
      .where(eq(buckets.id, bucketId));
  });
};

export const updateStatusToFinished = async (taskId: string) => {
  await db
    .update(tasks)
    .set({ status: "finished" })
    .where(eq(tasks.id, taskId));
};
