import { db } from "@workspace/server/drizzle/db.js";
import { buckets, files } from "@workspace/server/drizzle/schema.js";
import { eq, inArray, sql } from "drizzle-orm";

export async function getCourseIdByFileId({ fileId }: { fileId: string }) {
  const result = await db
    .select({ courseId: files.courseId })
    .from(files)
    .where(eq(files.id, fileId))
    .limit(1);

  if (result.length === 0) throw new Error("Not found");
  return result[0].courseId;
}

export async function getCourseIdsByFileIds({
  fileIds,
}: {
  fileIds: string[];
}) {
  const result = await db
    .select({ courseId: files.courseId })
    .from(files)
    .where(inArray(files.id, fileIds));

  return result.map((file) => file.courseId);
}

export async function getFileDetails({ fileId }: { fileId: string }) {
  const result = await db
    .select({ courseId: files.courseId, name: files.name })
    .from(files)
    .where(eq(files.id, fileId))
    .limit(1);

  if (result.length === 0) throw new Error("Not found");
  return {
    courseId: result[0].courseId,
    name: result[0].name,
  };
}

export async function getCourseFiles({ courseId }: { courseId: string }) {
  const result = await db
    .select({ id: files.id, name: files.name })
    .from(files)
    .where(eq(files.courseId, courseId));

  return result;
}

export async function deleteFile({
  bucketId,
  fileId,
}: {
  bucketId: string;
  fileId: string;
}) {
  await db.transaction(async (tx) => {
    // Delete the file and get its size
    const deletedFile = await tx
      .delete(files)
      .where(eq(files.id, fileId))
      .returning({ size: files.size });

    if (deletedFile.length === 0) {
      throw new Error(`File not found with ID ${fileId}`);
    }

    const deletedFileSize = deletedFile[0].size;

    // Update the bucket's size by subtracting the deleted file's size
    const updatedBucket = await tx
      .update(buckets)
      .set({ size: sql`${buckets.size} - ${deletedFileSize}` })
      .where(eq(buckets.id, bucketId))
      .returning({ id: buckets.id });

    if (updatedBucket.length === 0) {
      throw new Error(`Bucket not found with ID ${bucketId}`);
    }
  });
}
