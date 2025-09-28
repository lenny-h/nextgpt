import { createServiceClient } from "../../../utils/supabase/service-client.js";

export async function getBucketIdByCourseId({
  courseId,
}: {
  courseId: string;
}) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("courses")
    .select("bucket_id")
    .eq("id", courseId)
    .single();

  if (error) throw new Error("Not found");
  return data.bucket_id;
}

export async function getCourseDetails({ courseId }: { courseId: string }) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("courses")
    .select("bucket_id, name")
    .eq("id", courseId)
    .single();

  if (error) throw error;

  return {
    bucketId: data.bucket_id,
    name: data.name,
  };
}

export async function isPrivate({ courseId }: { courseId: string }) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("courses")
    .select("private")
    .eq("id", courseId)
    .single();

  if (error) throw new Error("Not found");
  return data.private;
}

export async function validateCoursesInBucket({
  courseIds,
  bucketId,
  userId,
}: {
  courseIds: string[];
  bucketId: string;
  userId: string;
}) {
  if (courseIds.length === 0) return true;

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("courses")
    .select("id, private")
    .eq("bucket_id", bucketId)
    .in("id", courseIds);

  if (error) throw error;

  // Check if all requested courses exist
  if (data.length !== courseIds.length) return false;

  const privateCourseIds = data
    .filter((course) => course.private)
    .map((course) => course.id);

  if (privateCourseIds.length > 0) {
    const { data: courseUsersData, error: courseUsersError } = await supabase
      .from("course_users")
      .select("course_id")
      .in("course_id", privateCourseIds)
      .eq("user_id", userId);

    if (courseUsersError) throw courseUsersError;

    if (courseUsersData.length < privateCourseIds.length) {
      return false;
    }
  }

  return true;
}

export async function getCourses({ bucketId }: { bucketId: string }) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("courses")
    .select()
    .eq("bucket_id", bucketId);

  if (error) throw error;
  return data;
}

export async function createCourse({
  name,
  description,
  bucketId,
  userId,
  encryptedKey,
}: {
  name: string;
  description: string;
  bucketId: string;
  userId: string;
  encryptedKey?: string;
}) {
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc("create_course", {
    p_name: name,
    p_description: description,
    p_bucket_id: bucketId,
    p_user_id: userId,
    p_encrypted_key: encryptedKey,
  });

  if (error) throw error;
  return { id: data };
}

export async function deleteCourse({ courseId }: { courseId: string }) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId)
    .select("name")
    .single();

  if (error) throw error;
  return data.name;
}
