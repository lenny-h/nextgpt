import { type Filter } from "@workspace/api-routes/schemas/filter-schema.js";
import { type PracticeFilter } from "@workspace/api-routes/schemas/practice-filter-schema.js";
import { type DocumentSource } from "@workspace/api-routes/types/document-source.js";
import { db } from "@workspace/server/drizzle/db.js";
import { pages } from "@workspace/server/drizzle/schema.js";
import {
  and,
  asc,
  cosineDistance,
  desc,
  eq,
  gt,
  inArray,
  sql,
} from "drizzle-orm";

export async function matchDocuments({
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
  const similarity = sql<number>`1 - (${cosineDistance(pages.embedding, queryEmbedding)})`;

  const baseQuery = db
    .select({
      id: pages.id,
      fileId: pages.fileId,
      fileName: pages.fileName,
      courseId: pages.courseId,
      courseName: pages.courseName,
      pageIndex: pages.pageIndex,
      ...(retrieveContent ? { content: pages.content } : {}),
      similarity,
    })
    .from(pages);

  const conditions = [gt(similarity, matchThreshold)];

  if (filter.files.length > 0) {
    if ("studyMode" in filter) {
      const fileIds = filter.files.map((file) => file.id);
      conditions.push(inArray(pages.fileId, fileIds));
    } else {
      conditions.push(inArray(pages.fileId, filter.files));
    }
  } else if (filter.courses.length > 0) {
    conditions.push(inArray(pages.courseId, filter.courses));
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
    };
    if (retrieveContent && "content" in doc && doc.content) {
      return { ...base, pageContent: doc.content as string };
    }
    return base;
  });
}

export async function searchPagesByContent({
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
          id: pages.id,
          fileId: pages.fileId,
          fileName: pages.fileName,
          courseId: pages.courseId,
          courseName: pages.courseName,
          pageIndex: pages.pageIndex,
          pageNumber: pages.pageNumber,
          content: pages.content,
        })
        .from(pages)
    : db
        .select({
          id: pages.id,
          fileId: pages.fileId,
          fileName: pages.fileName,
          courseId: pages.courseId,
          courseName: pages.courseName,
          pageIndex: pages.pageIndex,
          pageNumber: pages.pageNumber,
        })
        .from(pages);

  const conditions = [
    sql`to_tsvector('english', ${pages.content}) @@ to_tsquery('english', ${formattedQuery})`,
  ];

  if (filter.files && filter.files.length > 0) {
    if ("studyMode" in filter) {
      const fileIds = filter.files.map((file) => file.id);
      conditions.push(inArray(pages.fileId, fileIds));
    } else {
      conditions.push(inArray(pages.fileId, filter.files));
    }
  } else if (filter.courses && filter.courses.length > 0) {
    conditions.push(inArray(pages.courseId, filter.courses));
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
    };
    if (retrieveContent && "content" in doc && doc.content) {
      return { ...base, pageContent: doc.content as string };
    }
    return base;
  });
}

export async function retrievePagesByPageNumbers({
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
          id: pages.id,
          fileId: pages.fileId,
          fileName: pages.fileName,
          courseId: pages.courseId,
          courseName: pages.courseName,
          pageIndex: pages.pageIndex,
          content: pages.content,
        })
        .from(pages)
    : db
        .select({
          id: pages.id,
          fileId: pages.fileId,
          fileName: pages.fileName,
          courseId: pages.courseId,
          courseName: pages.courseName,
          pageIndex: pages.pageIndex,
        })
        .from(pages);

  const conditions = [inArray(pages.pageNumber, pageNumbers)];

  if (filter.files && filter.files.length > 0) {
    if ("studyMode" in filter) {
      const fileIds = filter.files.map((file) => file.id);
      conditions.push(inArray(pages.fileId, fileIds));
    } else {
      conditions.push(inArray(pages.fileId, filter.files));
    }
  } else if (filter.courses && filter.courses.length > 0) {
    conditions.push(inArray(pages.courseId, filter.courses));
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
    };
    if ("content" in doc && doc.content) {
      return { ...base, pageContent: doc.content as string };
    }
    return base;
  });
}

export async function retrievePagesByChapter({
  chapter,
  filter,
  retrieveContent = false,
}: {
  chapter: number;
  filter: Filter | PracticeFilter;
  retrieveContent?: boolean;
}) {
  const baseQuery = retrieveContent
    ? db
        .select({
          id: pages.id,
          fileId: pages.fileId,
          fileName: pages.fileName,
          courseId: pages.courseId,
          courseName: pages.courseName,
          pageIndex: pages.pageIndex,
          content: pages.content,
        })
        .from(pages)
    : db
        .select({
          id: pages.id,
          fileId: pages.fileId,
          fileName: pages.fileName,
          courseId: pages.courseId,
          courseName: pages.courseName,
          pageIndex: pages.pageIndex,
        })
        .from(pages);

  const conditions = [eq(pages.chapter, chapter)];

  if (filter.files && filter.files.length > 0) {
    if ("studyMode" in filter) {
      const fileIds = filter.files.map((file) => file.id);
      conditions.push(inArray(pages.fileId, fileIds));
    } else {
      conditions.push(inArray(pages.fileId, filter.files));
    }
  } else if (filter.courses && filter.courses.length > 0) {
    conditions.push(inArray(pages.courseId, filter.courses));
  }

  const data = await baseQuery
    .where(and(...conditions))
    .orderBy(asc(pages.pageIndex))
    .limit(8);

  return data.map((doc) => {
    const base = {
      id: doc.id,
      fileId: doc.fileId,
      fileName: doc.fileName,
      courseId: doc.courseId,
      courseName: doc.courseName,
      pageIndex: doc.pageIndex,
    };
    if ("content" in doc && doc.content) {
      return { ...base, pageContent: doc.content as string };
    }
    return base;
  });
}

export async function retrieveRandomSources({
  filter,
  retrieveContent = false,
}: {
  filter: PracticeFilter;
  retrieveContent?: boolean;
}): Promise<DocumentSource[]> {
  const fileIds = filter.files
    .filter((file) => file.chapters.length === 0)
    .map((file) => file.id);
  const fileObjects = filter.files.filter((file) => file.chapters.length !== 0);

  const randomPagesPromise =
    fileIds.length > 0
      ? db
          .select({
            id: pages.id,
            fileId: pages.fileId,
            fileName: pages.fileName,
            courseId: pages.courseId,
            courseName: pages.courseName,
            pageIndex: pages.pageIndex,
            ...(retrieveContent ? { content: pages.content } : {}),
          })
          .from(pages)
          .where(inArray(pages.fileId, fileIds))
          .orderBy(sql`random()`)
          .limit(4)
      : Promise.resolve([]);

  const randomChapterPagesPromises = fileObjects.map((fileObject) =>
    db
      .select({
        id: pages.id,
        fileId: pages.fileId,
        fileName: pages.fileName,
        courseId: pages.courseId,
        courseName: pages.courseName,
        pageIndex: pages.pageIndex,
        ...(retrieveContent ? { content: pages.content } : {}),
      })
      .from(pages)
      .where(
        and(
          eq(pages.fileId, fileObject.id),
          inArray(pages.chapter, fileObject.chapters)
        )
      )
      .orderBy(sql`random()`)
      .limit(4)
  );

  const [randomPages, ...randomChapterPagesResults] = await Promise.all([
    randomPagesPromise,
    ...randomChapterPagesPromises,
  ]);

  const randomChapterPages = randomChapterPagesResults.flat();

  const mapPage = (
    page: (typeof randomPages)[number] | (typeof randomChapterPages)[number]
  ) => {
    const base = {
      id: page.id,
      fileId: page.fileId,
      fileName: page.fileName,
      courseId: page.courseId,
      courseName: page.courseName,
      pageIndex: page.pageIndex,
    };
    if (retrieveContent && "content" in page && page.content) {
      return { ...base, pageContent: page.content as string };
    }
    return base;
  };

  return [...randomPages.map(mapPage), ...randomChapterPages.map(mapPage)];
}

export async function getFilePages({ fileId }: { fileId: string }) {
  return await db
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.fileId, fileId));
}
