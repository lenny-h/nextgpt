import { createServiceClient } from "../../../utils/supabase/service-client.js";

export async function isBucketMaintainer({
  userId,
  bucketId,
}: {
  userId: string;
  bucketId: string;
}) {
  const supabase = createServiceClient();

  const { count, error } = await supabase
    .from("bucket_maintainers")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("bucket_id", bucketId);

  if (error) throw error;
  return count !== null && count > 0;
}

export async function removeBucketMaintainer({
  userId,
  bucketId,
}: {
  userId: string;
  bucketId: string;
}) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("bucket_maintainers")
    .delete()
    .eq("user_id", userId)
    .eq("bucket_id", bucketId);

  if (error) throw error;
}

export async function removeBucketMaintainersBatch({
  userIds,
  bucketId,
}: {
  userIds: string[];
  bucketId: string;
}) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("bucket_maintainers")
    .delete()
    .eq("bucket_id", bucketId)
    .in("user_id", userIds);

  if (error) throw error;
}

export async function filterNonExistingBucketMaintainers({
  bucketId,
  userIds,
}: {
  bucketId: string;
  userIds: string[];
}) {
  const supabase = createServiceClient();

  // Get users that ARE already maintainers of the bucket
  const { data: existingMaintainers, error } = await supabase
    .from("bucket_maintainers")
    .select("user_id")
    .eq("bucket_id", bucketId)
    .in("user_id", userIds);

  if (error) throw error;

  const existingMaintainerIds = existingMaintainers.map((row) => row.user_id);

  // Return only users that are NOT maintainers of the bucket
  return userIds.filter((userId) => !existingMaintainerIds.includes(userId));
}
