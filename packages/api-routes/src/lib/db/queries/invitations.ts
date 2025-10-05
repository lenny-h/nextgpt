import { db } from "@workspace/server/drizzle/db.js";
import {
  bucketMaintainerInvitations,
  bucketMaintainers,
  buckets,
  bucketUsers,
  courseMaintainerInvitations,
  courseMaintainers,
  userInvitations,
} from "@workspace/server/drizzle/schema.js";
import { and, eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

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
  await db
    .insert(userInvitations)
    .values(
      invitations.map((inv) => ({
        origin: originUserId,
        target: inv,
        bucketId: bucketId,
        bucketName: bucketName,
      }))
    )
    .onConflictDoUpdate({
      target: [
        userInvitations.origin,
        userInvitations.target,
        userInvitations.bucketId,
      ],
      set: {
        bucketName: bucketName,
      },
    });
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
  await db
    .insert(courseMaintainerInvitations)
    .values(
      invitations.map((inv) => ({
        origin: originUserId,
        target: inv,
        courseId: courseId,
        courseName: courseName,
      }))
    )
    .onConflictDoUpdate({
      target: [
        courseMaintainerInvitations.origin,
        courseMaintainerInvitations.target,
        courseMaintainerInvitations.courseId,
      ],
      set: {
        courseName: courseName,
      },
    });
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
  await db
    .insert(bucketMaintainerInvitations)
    .values(
      invitations.map((inv) => ({
        origin: originUserId,
        target: inv,
        bucketId: bucketId,
        bucketName: bucketName,
      }))
    )
    .onConflictDoUpdate({
      target: [
        bucketMaintainerInvitations.origin,
        bucketMaintainerInvitations.target,
        bucketMaintainerInvitations.bucketId,
      ],
      set: {
        bucketName: bucketName,
      },
    });
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
  const bucket = await db
    .select({ type: buckets.type, usersCount: buckets.usersCount })
    .from(buckets)
    .where(eq(buckets.id, bucketId))
    .limit(1);

  if (bucket.length === 0) {
    throw new HTTPException(404, { message: "NOT_FOUND" });
  }

  if (bucket[0].usersCount >= maxUserCounts[bucket[0].type]) {
    throw new HTTPException(400, { message: "BUCKET_USER_LIMIT_EXCEEDED" });
  }

  await db.transaction(async (tx) => {
    // Insert the user into bucket_users if not exists
    await tx
      .insert(bucketUsers)
      .values({ bucketId, userId: targetUserId })
      .onConflictDoNothing();

    // Increase the bucket user count
    await tx
      .update(buckets)
      .set({ usersCount: sql`${buckets.usersCount} + 1` })
      .where(eq(buckets.id, bucketId));

    // Delete the invitation
    await tx
      .delete(userInvitations)
      .where(
        and(
          eq(userInvitations.origin, originUserId),
          eq(userInvitations.target, targetUserId),
          eq(userInvitations.bucketId, bucketId)
        )
      );
  });
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
  const maintainerCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(courseMaintainers)
    .where(eq(courseMaintainers.courseId, courseId));

  if (maintainerCount[0].count >= 20) {
    throw new HTTPException(400, {
      message: "COURSE_MAINTAINER_LIMIT_EXCEEDED",
    });
  }

  await db.transaction(async (tx) => {
    // Insert the user as a course maintainer if not exists
    await tx
      .insert(courseMaintainers)
      .values({ courseId, userId: targetUserId })
      .onConflictDoNothing();

    // Delete the invitation
    await tx
      .delete(courseMaintainerInvitations)
      .where(
        and(
          eq(courseMaintainerInvitations.origin, originUserId),
          eq(courseMaintainerInvitations.target, targetUserId),
          eq(courseMaintainerInvitations.courseId, courseId)
        )
      );
  });
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
  const maintainerCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(bucketMaintainers)
    .where(eq(bucketMaintainers.bucketId, bucketId));

  if (maintainerCount[0].count >= 20) {
    throw new HTTPException(400, {
      message: "COURSE_MAINTAINER_LIMIT_EXCEEDED",
    });
  }

  await db.transaction(async (tx) => {
    // Insert the user as a bucket maintainer if not exists
    await tx
      .insert(bucketMaintainers)
      .values({ bucketId, userId: targetUserId })
      .onConflictDoNothing();

    // Delete the invitation
    await tx
      .delete(bucketMaintainerInvitations)
      .where(
        and(
          eq(bucketMaintainerInvitations.origin, originUserId),
          eq(bucketMaintainerInvitations.target, targetUserId),
          eq(bucketMaintainerInvitations.bucketId, bucketId)
        )
      );
  });
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
  await db
    .delete(userInvitations)
    .where(
      and(
        eq(userInvitations.origin, originUserId),
        eq(userInvitations.target, targetUserId),
        eq(userInvitations.bucketId, bucketId)
      )
    );

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
  await db
    .delete(courseMaintainerInvitations)
    .where(
      and(
        eq(courseMaintainerInvitations.origin, originUserId),
        eq(courseMaintainerInvitations.target, targetUserId),
        eq(courseMaintainerInvitations.courseId, courseId)
      )
    );

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
  await db
    .delete(bucketMaintainerInvitations)
    .where(
      and(
        eq(bucketMaintainerInvitations.origin, originUserId),
        eq(bucketMaintainerInvitations.target, targetUserId),
        eq(bucketMaintainerInvitations.bucketId, bucketId)
      )
    );

  return { success: true };
}
