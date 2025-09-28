import { createServiceClient } from "../../../utils/supabase/service-client.js";

export async function getTaskDetails({ taskId }: { taskId: string }) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("course_id, name, status")
    .eq("id", taskId)
    .single();

  if (error) throw error;

  return {
    courseId: data.course_id,
    name: data.name,
    status: data.status,
  };
}

export async function addTask({
  id,
  courseId,
  filename,
  fileSize,
  pubDate,
}: {
  id: string;
  courseId: string;
  filename: string;
  fileSize: number;
  pubDate?: Date;
}) {
  const supabase = createServiceClient();

  // Call a stored procedure (RPC) that handles both inserting the task and updating bucket size
  const { error } = await supabase.rpc("add_task_and_update_bucket", {
    p_id: id,
    p_course_id: courseId,
    p_name: filename,
    p_file_size: fileSize,
    p_pub_date: pubDate ? pubDate.toISOString() : undefined,
  });

  if (error) throw error;
}

export async function deleteTask({ taskId }: { taskId: string }) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .select("id");

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Task not found");
  }
}
