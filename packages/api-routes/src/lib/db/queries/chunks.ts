import { type Filter } from "@workspace/api-routes/schemas/filter-schema.js";
import { type PracticeFilter } from "@workspace/api-routes/schemas/practice-filter-schema.js";
import { type DocumentSource } from "@workspace/api-routes/types/document-source.js";
import { parsePageRange } from "@workspace/api-routes/utils/parse-page-range.js";
import { db } from "@workspace/server/drizzle/db.js";
import { chunks } from "@workspace/server/drizzle/schema.js";
import { and, cosineDistance, desc, eq, gt, inArray, sql } from "drizzle-orm";

export async function searchChunksByVs({
  queryEmbedding,
  filter,
  retrieveContent = false,
  matchThreshold = 0.4,
  matchCount = 4,
}: {
  queryEmbedding: number[];
  filter: Filter | PracticeFilter;
  retrieveContent?: boolean;
  matchThreshold?: number;
  matchCount?: number;
}) {
  const similarity = sql<number>`1 - (${cosineDistance(chunks.embedding, queryEmbedding)})`;

  const baseQuery = db
    .select({
      id: chunks.id,
      fileId: chunks.fileId,
      fileName: chunks.fileName,
      courseId: chunks.courseId,
      courseName: chunks.courseName,
      pageIndex: chunks.pageIndex,
      bbox: chunks.bbox,
      ...(retrieveContent ? { content: chunks.content } : {}),
      similarity,
    })
    .from(chunks);

  const conditions = [gt(similarity, matchThreshold)];

  if (filter.files.length > 0) {
    if ("studyMode" in filter) {
      const fileIds = filter.files.map((f) => f.id);
      conditions.push(inArray(chunks.fileId, fileIds));
    } else {
      conditions.push(
        inArray(
          chunks.fileId,
          filter.files.map((f) => f.id)
        )
      );
    }
  } else {
    conditions.push(
      inArray(
        chunks.courseId,
        filter.courses.map((c) => c.id)
      )
    );
  }

  const result = await baseQuery
    .where(and(...conditions))
    .orderBy(desc(similarity))
    .limit(matchCount);

  return result.map((doc) => {
    const base = {
      id: doc.id,
      fileId: doc.fileId,
      fileName: doc.fileName,
      courseId: doc.courseId,
      courseName: doc.courseName,
      pageIndex: doc.pageIndex,
      bbox: (doc.bbox as [number, number, number, number] | null) || undefined,
    };
    if (retrieveContent && "content" in doc && doc.content) {
      return { ...base, pageContent: doc.content as string };
    }
    return base;
  });
}

export async function searchChunksByFts({
  searchQuery,
  filter,
  retrieveContent = false,
  limit = 4,
}: {
  searchQuery: string;
  filter: Filter | PracticeFilter;
  retrieveContent?: boolean;
  limit?: number;
}) {
  const formattedQuery = searchQuery
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .join(" | ");

  const baseQuery = retrieveContent
    ? db
        .select({
          id: chunks.id,
          fileId: chunks.fileId,
          fileName: chunks.fileName,
          courseId: chunks.courseId,
          courseName: chunks.courseName,
          pageIndex: chunks.pageIndex,
          pageNumber: chunks.pageNumber,
          bbox: chunks.bbox,
          content: chunks.content,
        })
        .from(chunks)
    : db
        .select({
          id: chunks.id,
          fileId: chunks.fileId,
          fileName: chunks.fileName,
          courseId: chunks.courseId,
          courseName: chunks.courseName,
          pageIndex: chunks.pageIndex,
          pageNumber: chunks.pageNumber,
          bbox: chunks.bbox,
        })
        .from(chunks);

  const conditions = [
    sql`to_tsvector('english', ${chunks.content}) @@ to_tsquery('english', ${formattedQuery})`,
  ];

  if (filter.files && filter.files.length > 0) {
    if ("studyMode" in filter) {
      const fileIds = filter.files.map((f) => f.id);
      conditions.push(inArray(chunks.fileId, fileIds));
    } else {
      conditions.push(
        inArray(
          chunks.fileId,
          filter.files.map((f) => f.id)
        )
      );
    }
  } else {
    conditions.push(
      inArray(
        chunks.courseId,
        filter.courses.map((c) => c.id)
      )
    );
  }

  const result = await baseQuery.where(and(...conditions)).limit(limit);

  return result.map((doc) => {
    const base = {
      id: doc.id,
      fileId: doc.fileId,
      fileName: doc.fileName,
      courseId: doc.courseId,
      courseName: doc.courseName,
      pageIndex: doc.pageIndex,
      bbox: (doc.bbox as [number, number, number, number] | null) || undefined,
    };
    if (retrieveContent && "content" in doc && doc.content) {
      return { ...base, pageContent: doc.content as string };
    }
    return base;
  });
}

export async function retrieveChunksByPageNumber({
  pageNumbers,
  filter,
  retrieveContent = false,
}: {
  pageNumbers: number[];
  filter: Filter | PracticeFilter;
  retrieveContent?: boolean;
}) {
  const baseQuery = retrieveContent
    ? db
        .select({
          id: chunks.id,
          fileId: chunks.fileId,
          fileName: chunks.fileName,
          courseId: chunks.courseId,
          courseName: chunks.courseName,
          pageIndex: chunks.pageIndex,
          bbox: chunks.bbox,
          content: chunks.content,
        })
        .from(chunks)
    : db
        .select({
          id: chunks.id,
          fileId: chunks.fileId,
          fileName: chunks.fileName,
          courseId: chunks.courseId,
          courseName: chunks.courseName,
          pageIndex: chunks.pageIndex,
          bbox: chunks.bbox,
        })
        .from(chunks);

  const conditions = [inArray(chunks.pageNumber, pageNumbers)];

  if (filter.files && filter.files.length > 0) {
    if ("studyMode" in filter) {
      const fileIds = filter.files.map((f) => f.id);
      conditions.push(inArray(chunks.fileId, fileIds));
    } else {
      conditions.push(
        inArray(
          chunks.fileId,
          filter.files.map((file) => file.id)
        )
      );
    }
  } else {
    conditions.push(
      inArray(
        chunks.courseId,
        filter.courses.map((c) => c.id)
      )
    );
  }

  const data = await baseQuery.where(and(...conditions)).limit(4);

  return data.map((doc) => {
    const base = {
      id: doc.id,
      fileId: doc.fileId,
      fileName: doc.fileName,
      courseId: doc.courseId,
      courseName: doc.courseName,
      pageIndex: doc.pageIndex,
      bbox: (doc.bbox as [number, number, number, number] | null) || undefined,
    };
    if ("content" in doc && doc.content) {
      return { ...base, pageContent: doc.content as string };
    }
    return base;
  });
}

export async function retrieveRandomChunks({
  filter,
  retrieveContent = false,
}: {
  filter: PracticeFilter;
  retrieveContent?: boolean;
}): Promise<DocumentSource[]> {
  // Separate files with and without page ranges
  const filesWithoutRange = filter.files.filter((file) => !file.pageRange);
  const filesWithRange = filter.files.filter((file) => file.pageRange);

  const promises: Promise<any[]>[] = [];

  // Query files without page ranges OR courses if no files specified
  if (filesWithoutRange.length > 0) {
    promises.push(
      db
        .select({
          id: chunks.id,
          fileId: chunks.fileId,
          fileName: chunks.fileName,
          courseId: chunks.courseId,
          courseName: chunks.courseName,
          pageIndex: chunks.pageIndex,
          bbox: chunks.bbox,
          ...(retrieveContent ? { content: chunks.content } : {}),
        })
        .from(chunks)
        .where(
          inArray(
            chunks.fileId,
            filesWithoutRange.map((f) => f.id)
          )
        )
        .orderBy(sql`random()`)
        .limit(4)
    );
  } else if (filter.files.length === 0 && filter.courses.length > 0) {
    promises.push(
      db
        .select({
          id: chunks.id,
          fileId: chunks.fileId,
          fileName: chunks.fileName,
          courseId: chunks.courseId,
          courseName: chunks.courseName,
          pageIndex: chunks.pageIndex,
          bbox: chunks.bbox,
          ...(retrieveContent ? { content: chunks.content } : {}),
        })
        .from(chunks)
        .where(
          inArray(
            chunks.courseId,
            filter.courses.map((c) => c.id)
          )
        )
        .orderBy(sql`random()`)
        .limit(4)
    );
  }

  // Query files with page ranges
  filesWithRange.forEach((file) => {
    const pageNumbers = parsePageRange(file.pageRange!);
    promises.push(
      db
        .select({
          id: chunks.id,
          fileId: chunks.fileId,
          fileName: chunks.fileName,
          courseId: chunks.courseId,
          courseName: chunks.courseName,
          pageIndex: chunks.pageIndex,
          bbox: chunks.bbox,
          ...(retrieveContent ? { content: chunks.content } : {}),
        })
        .from(chunks)
        .where(
          and(
            eq(chunks.fileId, file.id),
            inArray(chunks.pageNumber, pageNumbers)
          )
        )
        .orderBy(sql`random()`)
        .limit(4)
    );
  });

  const results = await Promise.all(promises);
  const allPages = results.flat();

  return allPages.map((page) => {
    const base = {
      id: page.id,
      fileId: page.fileId,
      fileName: page.fileName,
      courseId: page.courseId,
      courseName: page.courseName,
      pageIndex: page.pageIndex,
      bbox: (page.bbox as [number, number, number, number] | null) || undefined,
    };
    if (retrieveContent && "content" in page && page.content) {
      return { ...base, pageContent: page.content as string };
    }
    return base;
  });
}

export async function getFilePages({ fileId }: { fileId: string }) {
  return await db
    .select({ id: chunks.id })
    .from(chunks)
    .where(eq(chunks.fileId, fileId));
}
