import { isBucketUser } from "../lib/db/queries/buckets.js";
import { validateCoursesInBucket } from "../lib/db/queries/courses.js";
import { getCourseIdsByFileIds } from "../lib/db/queries/files.js";

interface UserMetadata {
  bucket_ids?: string[];
  course_ids?: string[];
  file_ids?: string[];
  [key: string]: any;
}

export async function userHasPermissions({
  userId,
  metadata,
  bucketId,
  courses,
  files,
}: {
  userId: string;
  metadata: UserMetadata;
  bucketId: string;
  courses: string[];
  files: string[];
}): Promise<boolean> {
  let courseIds: string[] = [];
  let fileIds: string[] = [];

  let permissionsCached = true;

  if (!metadata.bucket_ids?.includes(bucketId)) {
    const isAllowed = await isBucketUser({
      userId,
      bucketId,
    });
    if (!isAllowed) {
      return false;
    }
    permissionsCached = false;
  }

  if (courses.length > 0 || files.length > 0) {
    courseIds =
      files.length > 0
        ? [
            ...new Set([
              ...courses,
              ...(await getCourseIdsByFileIds({
                fileIds,
              })),
            ]),
          ]
        : courses;

    if (
      !courseIds.every((courseId) => metadata.course_ids?.includes(courseId)) ||
      !fileIds.every((fileId) => metadata.file_ids?.includes(fileId))
    ) {
      const coursesValid = await validateCoursesInBucket({
        courseIds,
        bucketId,
        userId,
      });
      if (!coursesValid) {
        return false;
      }
      permissionsCached = false;
    }
  }

  if (!permissionsCached) {
    // TODO: Cache in redis
  }

  return true;
}
