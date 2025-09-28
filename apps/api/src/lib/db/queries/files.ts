import { createServiceClient } from "../../../utils/supabase/service-client.js";

export async function getCourseIdByFileId({ fileId }: { fileId: string }) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("files")
    .select("course_id")
    .eq("id", fileId)
    .single();

  if (error) throw new Error("Not found");
  return data.course_id;
}

export async function getCourseIdsByFileIds({
  fileIds,
}: {
  fileIds: string[];
}) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("files")
    .select("course_id")
    .in("id", fileIds);

  if (error) throw error;
  return data.map((file) => file.course_id);
}

export async function getFileDetails({ fileId }: { fileId: string }) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("files")
    .select("course_id, name")
    .eq("id", fileId)
    .single();

  if (error) throw new Error("Not found");
  return {
    courseId: data.course_id,
    name: data.name,
  };
}

export async function getCourseFiles({ courseId }: { courseId: string }) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("files")
    .select("id, name")
    .eq("course_id", courseId);

  if (error) throw error;
  return data;
}

export async function deleteFile({
  bucketId,
  fileId,
}: {
  bucketId: string;
  fileId: string;
}) {
  const supabase = createServiceClient();

  const { error } = await supabase.rpc("delete_file_and_update_bucket_size", {
    p_file_id: fileId,
    p_bucket_id: bucketId,
  });

  if (error) throw error;
}
