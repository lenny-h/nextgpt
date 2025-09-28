import { createServiceClient } from "../../../utils/supabase/service-client.js";

export async function isCourseMaintainer({
  userId,
  courseId,
}: {
  userId: string;
  courseId: string;
}) {
  const supabase = createServiceClient();

  const { count, error } = await supabase
    .from("course_maintainers")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("course_id", courseId);

  if (error) throw error;
  return count !== null && count > 0;
}

export async function removeCourseMaintainer({
  userId,
  courseId,
}: {
  userId: string;
  courseId: string;
}) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("course_maintainers")
    .delete()
    .eq("user_id", userId)
    .eq("course_id", courseId);

  if (error) throw error;
}

export async function removeCourseMaintainersBatch({
  userIds,
  courseId,
}: {
  userIds: string[];
  courseId: string;
}) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("course_maintainers")
    .delete()
    .eq("course_id", courseId)
    .in("user_id", userIds);

  if (error) throw error;
}

export async function filterNonExistingCourseMaintainers({
  courseId,
  userIds,
}: {
  courseId: string;
  userIds: string[];
}) {
  const supabase = createServiceClient();

  // Get users that ARE already maintainers of the course
  const { data: existingMaintainers, error } = await supabase
    .from("course_maintainers")
    .select("user_id")
    .eq("course_id", courseId)
    .in("user_id", userIds);

  if (error) throw error;

  const existingMaintainerIds = existingMaintainers.map((row) => row.user_id);

  // Return only users that are NOT maintainers of the course
  return userIds.filter((userId) => !existingMaintainerIds.includes(userId));
}
