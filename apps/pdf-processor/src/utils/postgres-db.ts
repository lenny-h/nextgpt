import { createClient } from "@supabase/supabase-js";

interface EmbeddedPage {
  pageId: string;
  pageIndex: number;
  embedding: number[];
  content: string;
  chapter: number;
  pageNumber: number;
}

const CHUNK_SIZE = 100;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const uploadToPostgresDb = async (
  taskId: string,
  courseId: string,
  filename: string,
  fileSize: number,
  processedPages: EmbeddedPage[]
) => {
  let insertedFileId: string | null = null;

  try {
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("name")
      .eq("id", courseId)
      .single();

    if (courseError) {
      throw new Error("Course not found");
    }

    const { error: fileError } = await supabase
      .from("files")
      .insert({
        id: taskId,
        course_id: courseId,
        name: filename,
        size: fileSize,
      })
      .single();

    if (fileError) {
      throw new Error("Failed to insert file");
    }

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
          file_id: insertedFileId,
          file_name: filename,
          course_id: courseId,
          course_name: courseData.name,
          embedding: pageData.embedding,
          content: pageData.content,
          page_index: pageData.pageIndex,
          ...(pageData.pageNumber !== 0 &&
            Number.isInteger(pageData.pageNumber) && {
              page_number: pageData.pageNumber,
            }),
          ...(chapter !== 0 && { chapter }),
          ...(subChapter !== 0 && { sub_chapter: subChapter }),
        };
      });

      const { error: pagesError } = await supabase
        .from("pages")
        .insert(pagesToInsert);

      if (pagesError) {
        console.error("Error inserting pages:", pagesError);
        throw new Error("Failed to insert pages");
      }
    }
  } catch (error) {
    // Cleanup on failure
    if (insertedFileId) {
      // Delete all pages associated with this file
      await supabase.from("pages").delete().eq("file_id", insertedFileId);

      // Delete the file
      await supabase.from("files").delete().eq("id", insertedFileId);
    }
    throw error;
  }
};

export const updateStatusToProcessing = async (taskId: string) => {
  const { error } = await supabase
    .from("tasks")
    .update({ status: "processing" })
    .eq("id", taskId);

  if (error) {
    throw new Error("Failed to update task status to processing");
  }
};

export const updateStatusToFailed = async (
  taskId: string,
  bucketId: string
) => {
  const { error: error } = await supabase.rpc("update_status_to_failed", {
    p_task_id: taskId,
    p_bucket_id: bucketId,
  });

  if (error) {
    throw new Error("Failed to update bucket size");
  }
};

export const updateStatusToFinished = async (taskId: string) => {
  const { error } = await supabase
    .from("tasks")
    .update({ status: "finished" })
    .eq("id", taskId);

  if (error) {
    throw new Error("Failed to update task status to finished");
  }
};
