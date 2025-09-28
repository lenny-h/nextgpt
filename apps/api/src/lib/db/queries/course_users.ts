import { createServiceClient } from "../../../utils/supabase/service-client.js";

export async function addUserToCourse({
  courseId,
  userId,
}: {
  courseId: string;
  userId: string;
}) {
  const supabase = createServiceClient();

  const { error } = await supabase.from("course_users").upsert({
    course_id: courseId,
    user_id: userId,
  });

  if (error) {
    throw new Error("Failed to add user to course");
  }
}

export async function checkUserCourseAccess({
  courseId,
  userId,
}: {
  courseId: string;
  userId: string;
}) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("course_users")
    .select("course_id")
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .single();

  return !error;
}
