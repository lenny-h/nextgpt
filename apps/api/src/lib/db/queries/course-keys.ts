import { HTTPException } from "hono/http-exception";
import { decryptApiKey } from "../../../utils/encryption.js";
import { createServiceClient } from "../../../utils/supabase/service-client.js";

export async function validateCourseKey({
  courseId,
  key,
}: {
  courseId: string;
  key: string;
}) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("course_keys")
    .select("key")
    .eq("course_id", courseId)
    .single();

  if (error) {
    throw new HTTPException(400, {
      message: "Course not found or key not available",
    });
  }

  if (key !== decryptApiKey(data.key)) {
    throw new HTTPException(403, { message: "Invalid course key" });
  }

  return true;
}
