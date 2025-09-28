import { createServiceClient } from "../../../utils/supabase/service-client.js";

const maxUserCounts = {
  small: 5,
  medium: 50,
  large: 500,
  org: 20000,
};

export async function addUserInvitationsBatch({
  originUserId,
  invitations,
  bucketId,
  bucketName,
}: {
  originUserId: string;
  invitations: string[];
  bucketId: string;
  bucketName: string;
}) {
  const supabase = createServiceClient();

  const { error } = await supabase.from("user_invitations").upsert(
    invitations.map((inv) => ({
      origin: originUserId,
      target: inv,
      bucket_id: bucketId,
      bucket_name: bucketName,
    }))
  );

  if (error) throw error;
}

export async function addCourseMaintainerInvitationsBatch({
  originUserId,
  invitations,
  courseId,
  courseName,
}: {
  originUserId: string;
  invitations: string[];
  courseId: string;
  courseName: string;
}) {
  const supabase = createServiceClient();

  const { error } = await supabase.from("course_maintainer_invitations").upsert(
    invitations.map((inv) => ({
      origin: originUserId,
      target: inv,
      course_id: courseId,
      course_name: courseName,
    }))
  );

  if (error) throw error;
}

export async function addBucketMaintainerInvitationsBatch({
  originUserId,
  invitations,
  bucketId,
  bucketName,
}: {
  originUserId: string;
  invitations: string[];
  bucketId: string;
  bucketName: string;
}) {
  const supabase = createServiceClient();

  const { error } = await supabase.from("bucket_maintainer_invitations").upsert(
    invitations.map((inv) => ({
      origin: originUserId,
      target: inv,
      bucket_id: bucketId,
      bucket_name: bucketName,
    }))
  );

  if (error) throw error;
}

export async function acceptUserInvitation({
  originUserId,
  targetUserId,
  bucketId,
}: {
  originUserId: string;
  targetUserId: string;
  bucketId: string;
}) {
  const supabase = createServiceClient();

  const { data: bucket, error: bucketError } = await supabase
    .from("buckets")
    .select("type, users_count")
    .eq("id", bucketId)
    .single();

  if (bucketError) throw bucketError;

  if (bucket.users_count >= maxUserCounts[bucket.type]) {
    throw new Error(
      `Bucket has reached the maximum number of users (${
        maxUserCounts[bucket.type]
      })`
    );
  }

  const { data, error } = await supabase.rpc("accept_invitation", {
    p_invitation_type: "user",
    p_origin_user_id: originUserId,
    p_target_user_id: targetUserId,
    p_resource_id: bucketId,
  });

  if (error) throw error;
  return data;
}

export async function acceptCourseMaintainerInvitation({
  originUserId,
  targetUserId,
  courseId,
}: {
  originUserId: string;
  targetUserId: string;
  courseId: string;
}) {
  const supabase = createServiceClient();

  const { count, error: countError } = await supabase
    .from("course_maintainers")
    .select("*", { count: "exact", head: true })
    .eq("course_id", courseId);

  if (countError) throw countError;

  if (count == null || count >= 20) {
    throw new Error(
      "Course has reached the maximum number of maintainers (20)"
    );
  }

  const { data, error } = await supabase.rpc("accept_invitation", {
    p_invitation_type: "course_maintainer",
    p_origin_user_id: originUserId,
    p_target_user_id: targetUserId,
    p_resource_id: courseId,
  });

  if (error) throw error;
  return data;
}

export async function acceptBucketMaintainerInvitation({
  originUserId,
  targetUserId,
  bucketId,
}: {
  originUserId: string;
  targetUserId: string;
  bucketId: string;
}) {
  const supabase = createServiceClient();

  const { count, error: countError } = await supabase
    .from("bucket_maintainers")
    .select("*", { count: "exact", head: true })
    .eq("course_id", bucketId);

  if (countError) throw countError;

  if (count == null || count >= 20) {
    throw new Error(
      "Bucket has reached the maximum number of maintainers (20)"
    );
  }

  const { data, error } = await supabase.rpc("accept_invitation", {
    p_invitation_type: "bucket_maintainer",
    p_origin_user_id: originUserId,
    p_target_user_id: targetUserId,
    p_resource_id: bucketId,
  });

  if (error) throw error;
  return data;
}

export async function deleteUserInvitation({
  originUserId,
  targetUserId,
  bucketId,
}: {
  originUserId: string;
  targetUserId: string;
  bucketId: string;
}) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("user_invitations")
    .delete()
    .eq("origin", originUserId)
    .eq("target", targetUserId)
    .eq("bucket_id", bucketId);

  if (error) throw error;
  return { success: true };
}

export async function deleteCourseMaintainerInvitation({
  originUserId,
  targetUserId,
  courseId,
}: {
  originUserId: string;
  targetUserId: string;
  courseId: string;
}) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("course_maintainer_invitations")
    .delete()
    .eq("origin", originUserId)
    .eq("target", targetUserId)
    .eq("course_id", courseId);

  if (error) throw error;
  return { success: true };
}

export async function deleteBucketMaintainerInvitation({
  originUserId,
  targetUserId,
  bucketId,
}: {
  originUserId: string;
  targetUserId: string;
  bucketId: string;
}) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("bucket_maintainer_invitations")
    .delete()
    .eq("origin", originUserId)
    .eq("target", targetUserId)
    .eq("bucket_id", bucketId);

  if (error) throw error;
  return { success: true };
}
