import { db } from "@workspace/server/drizzle/db.js";
import { documents, prompts } from "@workspace/server/drizzle/schema.js";
import { createLogger } from "@workspace/server/logger.js";
import {
  getRedisClient,
  getUserPermissionsCacheKey,
  PERMISSIONS_CACHE_TTL,
  type UserPermissionsCache,
} from "@workspace/server/utils/access-clients/redis-client.js";
import { and, eq, inArray } from "drizzle-orm";
import { isBucketUser } from "../lib/db/queries/buckets.js";
import { validateCoursesInBucket } from "../lib/db/queries/courses.js";
import { getCourseIdsByFileIds } from "../lib/db/queries/files.js";
import { Attachment } from "../schemas/attachment-schema.js";

const logger = createLogger("user-has-permissions");

export async function userHasPermissions({
  userId,
  filterBucketId,
  filterCourseIds,
  filterFileIds,
  filterAttachments,
  filterDocumentIds,
  filterPromptIds,
}: {
  userId: string;
  filterBucketId: string;
  filterCourseIds: string[];
  filterFileIds: string[];
  filterAttachments: Attachment[];
  filterDocumentIds: string[];
  filterPromptIds: string[];
}): Promise<boolean> {
  let courseIds: string[] = [];
  let fileIds: string[] = filterFileIds;

  let permissionsCached = true;

  // Get cached permissions from Redis
  const redis = await getRedisClient();
  const cacheKey = getUserPermissionsCacheKey(userId);
  const cachedData = await redis.get(cacheKey);

  let metadata: UserPermissionsCache = {
    bucket_ids: [],
    course_ids: [],
    file_ids: [],
    document_ids: [],
    prompt_ids: [],
  };

  if (cachedData) {
    try {
      metadata = JSON.parse(cachedData);
    } catch (error) {
      logger.error("Error parsing cached permissions:", error);
    }
  }

  // Validate bucket permissions
  if (!metadata.bucket_ids?.includes(filterBucketId)) {
    const isAllowed = await isBucketUser({
      userId,
      bucketId: filterBucketId,
    });
    if (!isAllowed) {
      return false;
    }
    permissionsCached = false;
  }

  // Validate course and file permissions
  if (filterCourseIds.length > 0 || filterFileIds.length > 0) {
    courseIds =
      filterFileIds.length > 0
        ? [
            ...new Set([
              ...filterCourseIds,
              ...(await getCourseIdsByFileIds({
                fileIds,
              })),
            ]),
          ]
        : filterCourseIds;

    if (
      !courseIds.every((courseId) => metadata.course_ids?.includes(courseId)) ||
      !fileIds.every((fileId) => metadata.file_ids?.includes(fileId))
    ) {
      const coursesValid = await validateCoursesInBucket({
        bucketId: filterBucketId,
        courseIds,
        userId,
      });
      if (!coursesValid) {
        return false;
      }
      permissionsCached = false;
    }
  }

  // Validate attachment URLs
  if (filterAttachments.length > 0) {
    for (const attachment of filterAttachments) {
      if (!attachment.filename.startsWith(userId)) {
        return false;
      }
    }
  }

  // Validate document access
  if (filterDocumentIds.length > 0) {
    if (
      !filterDocumentIds.every((docId) => metadata.document_ids.includes(docId))
    ) {
      const userDocuments = await db
        .select({
          id: documents.id,
        })
        .from(documents)
        .where(
          and(
            eq(documents.userId, userId),
            inArray(documents.id, filterDocumentIds)
          )
        );

      if (userDocuments.length !== filterDocumentIds.length) {
        return false;
      }

      permissionsCached = false;
    }
  }

  // Validate prompt access
  if (filterPromptIds.length > 0) {
    if (
      !filterPromptIds.every((promptId) =>
        metadata.prompt_ids.includes(promptId)
      )
    ) {
      const userPrompts = await db
        .select({
          id: prompts.id,
        })
        .from(prompts)
        .where(
          and(eq(prompts.userId, userId), inArray(prompts.id, filterPromptIds))
        );

      if (userPrompts.length !== filterPromptIds.length) {
        return false;
      }
      permissionsCached = false;
    }
  }

  // Update cache in Redis if permissions were validated
  if (!permissionsCached) {
    const updatedMetadata: UserPermissionsCache = {
      bucket_ids: [...new Set([...metadata.bucket_ids, filterBucketId])],
      course_ids: [...new Set([...metadata.course_ids, ...courseIds])],
      file_ids: [...new Set([...metadata.file_ids, ...fileIds])],
      document_ids: [
        ...new Set([...metadata.document_ids, ...filterDocumentIds]),
      ],
      prompt_ids: [
        ...new Set([...(metadata.prompt_ids || []), ...filterPromptIds]),
      ],
    };

    await redis.set(cacheKey, JSON.stringify(updatedMetadata), {
      EX: PERMISSIONS_CACHE_TTL,
    });
  }

  return true;
}
