import { db } from "@workspace/server/drizzle/db.js";
import {
  bucketMaintainerInvitations,
  buckets,
  bucketUserRoles,
  courseMaintainerInvitations,
  courseUserRoles,
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
  // Verify the invitation exists
  const invitation = await db
    .select()
    .from(userInvitations)
    .where(
      and(
        eq(userInvitations.origin, originUserId),
        eq(userInvitations.target, targetUserId),
        eq(userInvitations.bucketId, bucketId)
      )
    )
    .limit(1);

  if (invitation.length === 0) {
    throw new HTTPException(404, {
      message: "NOT_FOUND",
    });
  }

  // If desired, limit the number of users in a bucket here
  // const userCount = await db
  //   .select({ count: sql<number>`count(*)` })
  //   .from(bucketUserRoles)
  //   .where(eq(bucketUserRoles.bucketId, bucketId));

  await db.transaction(async (tx) => {
    // Insert the user into bucket_users if not exists
    await tx
      .insert(bucketUserRoles)
      .values({ bucketId, userId: targetUserId })
      .onConflictDoNothing();

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
  // Verify the invitation exists
  const invitation = await db
    .select()
    .from(courseMaintainerInvitations)
    .where(
      and(
        eq(courseMaintainerInvitations.origin, originUserId),
        eq(courseMaintainerInvitations.target, targetUserId),
        eq(courseMaintainerInvitations.courseId, courseId)
      )
    )
    .limit(1);

  if (invitation.length === 0) {
    throw new HTTPException(404, {
      message: "NOT_FOUND",
    });
  }

  const maintainerCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(courseUserRoles)
    .where(
      and(
        eq(courseUserRoles.courseId, courseId),
        eq(courseUserRoles.role, "maintainer")
      )
    );

  if (maintainerCount[0].count >= 20) {
    throw new HTTPException(400, {
      message: "COURSE_MAINTAINER_LIMIT_EXCEEDED",
    });
  }

  await db.transaction(async (tx) => {
    // Insert the user as a course maintainer
    await tx
      .insert(courseUserRoles)
      .values({ courseId, userId: targetUserId, role: "maintainer" })
      .onConflictDoUpdate({
        target: [courseUserRoles.courseId, courseUserRoles.userId],
        set: {
          role: "maintainer",
        },
      });

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
  // Verify the invitation exists
  const invitation = await db
    .select()
    .from(bucketMaintainerInvitations)
    .where(
      and(
        eq(bucketMaintainerInvitations.origin, originUserId),
        eq(bucketMaintainerInvitations.target, targetUserId),
        eq(bucketMaintainerInvitations.bucketId, bucketId)
      )
    )
    .limit(1);

  if (invitation.length === 0) {
    throw new HTTPException(404, {
      message: "NOT_FOUND",
    });
  }

  const maintainerCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(bucketUserRoles)
    .where(
      and(
        eq(bucketUserRoles.bucketId, bucketId),
        eq(bucketUserRoles.role, "maintainer")
      )
    );

  if (maintainerCount[0].count >= 20) {
    throw new HTTPException(400, {
      message: "COURSE_MAINTAINER_LIMIT_EXCEEDED",
    });
  }

  await db.transaction(async (tx) => {
    // Insert the user as a bucket maintainer if not exists
    await tx
      .insert(bucketUserRoles)
      .values({ bucketId, userId: targetUserId, role: "maintainer" })
      .onConflictDoUpdate({
        target: [bucketUserRoles.bucketId, bucketUserRoles.userId],
        set: {
          role: "maintainer",
        },
      });

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
