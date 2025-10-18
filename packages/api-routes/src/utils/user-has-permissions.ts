import {
  getRedisClient,
  getUserPermissionsCacheKey,
  PERMISSIONS_CACHE_TTL,
  type UserPermissionsCache,
} from "@workspace/server/utils/access-clients/redis-client.js";
import { HTTPException } from "hono/http-exception";
import { isBucketUser } from "../lib/db/queries/buckets.js";
import { validateCoursesInBucket } from "../lib/db/queries/courses.js";
import { getCourseIdsByFileIds } from "../lib/db/queries/files.js";

export async function userHasPermissions({
  userId,
  filterBucketId,
  filterCourseIds,
  filterFileIds,
  filterAttachments,
}: {
  userId: string;
  filterBucketId: string;
  filterCourseIds: string[];
  filterFileIds: string[];
  filterAttachments: { url: string }[];
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
  };

  if (cachedData) {
    try {
      metadata = JSON.parse(cachedData);
    } catch (error) {
      console.error("Error parsing cached permissions:", error);
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
    const expectedPrefix = process.env.ATTACHMENT_URL_PREFIX!;

    for (const part of filterAttachments) {
      if (!part.url.startsWith(expectedPrefix)) {
        throw new HTTPException(403, { message: "FORBIDDEN" });
      }

      const rest = part.url.substring(expectedPrefix.length);
      if (!rest.startsWith(userId)) {
        throw new HTTPException(403, { message: "FORBIDDEN" });
      }
    }
  }

  // Update cache in Redis if permissions were validated
  if (!permissionsCached) {
    const updatedMetadata: UserPermissionsCache = {
      bucket_ids: [...new Set([...metadata.bucket_ids, filterBucketId])],
      course_ids: [...new Set([...metadata.course_ids, ...courseIds])],
      file_ids: [...new Set([...metadata.file_ids, ...fileIds])],
    };

    await redis.set(cacheKey, JSON.stringify(updatedMetadata), {
      EX: PERMISSIONS_CACHE_TTL,
    });
  }

  return true;
}
