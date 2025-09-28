import { createServiceClient } from "../../../utils/supabase/service-client.js";

export async function filterNonExistingBucketUsers({
  bucketId,
  userIds,
}: {
  bucketId: string;
  userIds: string[];
}) {
  const supabase = createServiceClient();

  // Get users that ARE already in the bucket
  const { data: existingUsers, error } = await supabase
    .from("bucket_users")
    .select("user_id")
    .eq("bucket_id", bucketId)
    .in("user_id", userIds);

  if (error) throw error;

  const existingUserIds = existingUsers.map((row) => row.user_id);

  // Return only users that are NOT in the bucket
  return userIds.filter((userId) => !existingUserIds.includes(userId));
}
