import { createServiceClient } from "../../../utils/supabase/service-client.js";

const maxFileSizes = {
  small: 2,
  medium: 5,
  large: 10,
  org: 50,
};

export async function getBuckets({ userId }: { userId: string }) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("buckets")
    .select()
    .eq("owner", userId);

  if (error) throw error;
  return data;
}

export async function getBucketOwner({ bucketId }: { bucketId: string }) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("buckets")
    .select("owner, name")
    .eq("id", bucketId)
    .single();

  if (error) throw error;
  return data;
}

export async function getBucketName({ bucketId }: { bucketId: string }) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("buckets")
    .select("name")
    .eq("id", bucketId)
    .single();

  if (error) throw error;
  return data.name;
}

export async function getUserBuckets({ userId }: { userId: string }) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("bucket_users")
    .select("bucket_id")
    .eq("user_id", userId);

  if (error) throw error;
  return data;
}

export async function isBucketUser({
  userId,
  bucketId,
}: {
  userId: string;
  bucketId: string;
}) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("bucket_users")
    .select("bucket_id")
    .eq("bucket_id", bucketId)
    .eq("user_id", userId)
    .limit(1);

  if (error) throw error;
  return data.length > 0;
}

export async function isBucketOwner({
  userId,
  bucketId,
}: {
  userId: string;
  bucketId: string;
}) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("buckets")
    .select("owner")
    .eq("id", bucketId)
    .single();

  if (error) throw error;
  return data.owner === userId;
}

export async function createBucket({
  userId,
  name,
  type,
}: {
  userId: string;
  name: string;
  type: "small" | "medium" | "large";
}) {
  const supabase = createServiceClient();

  const maxSize = maxFileSizes[type] * 1024 * 1024 * 1024;

  const { error } = await supabase.rpc("create_bucket", {
    // Creates bucket and adds owner as user and bucket maintainer
    p_owner: userId,
    p_name: name,
    p_type: type,
    p_max_size: maxSize,
  });

  if (error) throw error;
}

export async function deleteBucket({ bucketId }: { bucketId: string }) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("buckets")
    .delete()
    .eq("id", bucketId)
    .select("name")
    .single();

  if (error) throw error;
  return { name: data.name };
}

export async function getBucketSize({ bucketId }: { bucketId: string }) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("buckets")
    .select("size, max_size")
    .eq("id", bucketId)
    .single();

  if (error) throw error;
  return {
    size: data.size,
    maxSize: data.max_size,
  };
}

export async function increaseBucketSize({
  bucketId,
  fileSize,
}: {
  bucketId: string;
  fileSize: number;
}) {
  const supabase = createServiceClient();

  // Call the RPC function to increase bucket size in a single operation
  const { error } = await supabase.rpc("increase_bucket_size", {
    p_bucket_id: bucketId,
    p_file_size: fileSize,
  });

  if (error) throw error;
}
