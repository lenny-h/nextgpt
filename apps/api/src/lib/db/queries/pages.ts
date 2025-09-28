import { type Filter } from "../../../schemas/filter-schema.js";
import { type PracticeFilter } from "../../../schemas/practice-filter-schema.js";
import { type DocumentSource } from "../../../types/document-source.js";
import { createServiceClient } from "../../../utils/supabase/service-client.js";

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
  const supabase = createServiceClient();

  const params: any = {
    query_embedding: queryEmbedding,
    retrieve_content: retrieveContent,
    match_threshold: matchThreshold,
    match_count: matchCount,
  };

  if (filter.files.length > 0) {
    if ("studyMode" in filter) {
      params.file_ids = filter.files.map((file) => file.id);
    } else {
      params.file_ids = filter.files;
    }
  } else if (filter.courses.length > 0) {
    params.course_ids = filter.courses;
  }

  const { data, error } = await supabase.rpc("match_documents", params);

  if (error) throw error;

  return data.map((doc) => ({
    id: doc.id,
    fileId: doc.file_id,
    fileName: doc.file_name,
    courseId: doc.course_id,
    courseName: doc.course_name,
    pageIndex: doc.page_index,
    ...("content" in doc ? { pageContent: doc.content } : {}),
  }));
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
  // Format the search query for full-text search
  // Replace spaces with & for AND search or | for OR search
  const formattedQuery = searchQuery
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .join(" | ");

  const supabase = createServiceClient();

  let query = retrieveContent
    ? supabase.from("pages").select(
        `
    id,
    file_id,
    file_name,
    course_id,
    course_name,
    page_index,
    page_number,
    content
  `
      )
    : supabase.from("pages").select(
        `
    id, 
    file_id, 
    file_name, 
    course_id, 
    course_name, 
    page_index, 
    page_number
  `
      );

  if (filter.files && filter.files.length > 0) {
    if ("studyMode" in filter) {
      query = query
        .in(
          "file_id",
          filter.files.map((file) => file.id)
        )
        .textSearch("content", formattedQuery);
    } else {
      query = query
        .in("file_id", filter.files)
        .textSearch("content", formattedQuery);
    }
  } else if (filter.courses && filter.courses.length > 0) {
    query = query
      .in("course_id", filter.courses)
      .textSearch("content", formattedQuery);
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    throw error;
  }

  return data.map((doc) => ({
    id: doc.id,
    fileId: doc.file_id,
    fileName: doc.file_name,
    courseId: doc.course_id,
    courseName: doc.course_name,
    pageIndex: doc.page_index,
    pageNumber: doc.page_number,
    ...("content" in doc ? { pageContent: doc.content } : {}),
  }));
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
  const supabase = createServiceClient();

  let query = retrieveContent
    ? supabase
        .from("pages")
        .select(
          "id, file_id, file_name, course_id, course_name, page_index, content"
        )
    : supabase
        .from("pages")
        .select("id, file_id, file_name, course_id, course_name, page_index");

  if (filter.files && filter.files.length > 0) {
    if ("studyMode" in filter) {
      query = query
        .in(
          "file_id",
          filter.files.map((file) => file.id)
        )
        .in("page_number", pageNumbers)
        .limit(4);
    } else {
      query = query
        .in("file_id", filter.files)
        .in("page_number", pageNumbers)
        .limit(4);
    }
  } else if (filter.courses && filter.courses.length > 0) {
    query = query
      .in("course_id", filter.courses)
      .in("page_number", pageNumbers)
      .limit(4);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data.map((doc) => ({
    id: doc.id,
    fileId: doc.file_id,
    fileName: doc.file_name,
    courseId: doc.course_id,
    courseName: doc.course_name,
    pageIndex: doc.page_index,
    ...("content" in doc && doc.content ? { pageContent: doc.content } : {}),
  }));
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
  const supabase = createServiceClient();

  let query = retrieveContent
    ? supabase
        .from("pages")
        .select(
          "id, file_id, file_name, course_id, course_name, page_index, content"
        )
    : supabase
        .from("pages")
        .select("id, file_id, file_name, course_id, course_name, page_index");

  if (filter.files && filter.files.length > 0) {
    if ("studyMode" in filter) {
      query = query
        .in(
          "file_id",
          filter.files.map((file) => file.id)
        )
        .eq("chapter", chapter)
        .order("page_index", { ascending: true })
        .limit(8);
    } else {
      query = query
        .in("file_id", filter.files)
        .eq("chapter", chapter)
        .order("page_index", { ascending: true })
        .limit(8);
    }
  } else if (filter.courses && filter.courses.length > 0) {
    query = query
      .in("course_id", filter.courses)
      .eq("chapter", chapter)
      .order("page_index", { ascending: true })
      .limit(8);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data.map((doc) => ({
    id: doc.id,
    fileId: doc.file_id,
    fileName: doc.file_name,
    courseId: doc.course_id,
    courseName: doc.course_name,
    pageIndex: doc.page_index,
    ...("content" in doc && doc.content ? { pageContent: doc.content } : {}),
  }));
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

  const supabase = createServiceClient();

  const randomPagesPromise =
    fileIds.length > 0
      ? supabase.rpc("get_random_pages", {
          p_file_ids: fileIds,
          retrieve_content: retrieveContent,
        })
      : Promise.resolve({ data: [], error: null });

  const randomChapterPagesPromises = fileObjects.map((fileObject) =>
    supabase.rpc("get_random_chapter_pages", {
      p_file_id: fileObject.id,
      p_file_chapters: fileObject.chapters,
      retrieve_content: retrieveContent,
    })
  );

  const randomChapterPagesPromise = Promise.all(
    randomChapterPagesPromises
  ).then((results) => {
    return {
      data: results.flatMap((result) => result.data || []),
      error: results.find((result) => result.error)?.error || null,
    };
  });

  const [randomPages, randomChapterPages] = await Promise.all([
    randomPagesPromise,
    randomChapterPagesPromise,
  ]);

  if (randomPages.error) throw randomPages.error;
  if (randomChapterPages.error) throw randomChapterPages.error;

  return [
    ...(randomPages.data?.map((page) => ({
      id: page.id,
      fileId: page.file_id,
      fileName: page.file_name,
      courseId: page.course_id,
      courseName: page.course_name,
      pageIndex: page.page_index,
      ...(page.content && { pageContent: page.content }),
    })) || []),
    ...(randomChapterPages.data?.map((page) => ({
      id: page.id,
      fileId: page.file_id,
      fileName: page.file_name,
      courseId: page.course_id,
      courseName: page.course_name,
      pageIndex: page.page_index,
      ...(page.content && { pageContent: page.content }),
    })) || []),
  ];
}

export async function getFilePages({ fileId }: { fileId: string }) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("pages")
    .select("id")
    .eq("file_id", fileId);

  if (error) throw error;
  return data;
}

export async function deletePage({ pageId }: { pageId: string }) {
  const supabase = createServiceClient();

  const { error } = await supabase.from("pages").delete().eq("id", pageId);

  if (error) throw error;
}
