import * as z from "zod";

import { increaseBucketSize } from "@workspace/api-routes/lib/db/queries/buckets.js";
import { isCourseMaintainer } from "@workspace/api-routes/lib/db/queries/course-maintainers.js";
import { getBucketSizeByCourseId } from "@workspace/api-routes/lib/db/queries/courses.js";
import { addTask } from "@workspace/api-routes/lib/db/queries/tasks.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import type { JobType } from "@workspace/api-routes/utils/access-clients/interfaces/tasks-client.interface.js";
import { getStorageClient } from "@workspace/api-routes/utils/access-clients/storage-client.js";
import { getTasksClient } from "@workspace/api-routes/utils/access-clients/tasks-client.js";
import { generateUUID } from "@workspace/api-routes/utils/utils.js";
import { createLogger } from "@workspace/server/logger.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { getSignedUrlSchema } from "./schema.js";

const logger = createLogger("get-signed-url");

const paramSchema = z.object({ courseId: uuidSchema }).strict();

const app = new Hono().post(
  "/",
  validator("param", (value) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  validator("json", async (value, c) => {
    const parsed = getSignedUrlSchema.safeParse(value);
    if (!parsed.success) {
      // Check if the error is related to the filename field
      const filenameError = parsed.error.issues.find((issue) =>
        issue.path.includes("filename")
      );
      if (filenameError) {
        throw new HTTPException(400, { message: "INVALID_FILENAME" });
      }
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { courseId } = c.req.valid("param");

    const {
      filename,
      fileSize,
      fileType,
      processingDate,
      pageNumberOffset,
      pdfPipelineOptions,
    } = c.req.valid("json");
    const user = c.get("user");

    const isMaintainer = await isCourseMaintainer({
      userId: user.id,
      courseId,
    });

    if (!isMaintainer) {
      throw new HTTPException(403, { message: "FORBIDDEN" });
    }

    if (processingDate && !Date.parse(processingDate)) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }

    const bucketSizeInfo = await getBucketSizeByCourseId({ courseId });

    if (bucketSizeInfo.size + fileSize > bucketSizeInfo.maxSize) {
      throw new HTTPException(400, {
        message: "BUCKET_SIZE_EXCEEDED",
      });
    }

    await increaseBucketSize({ bucketId: bucketSizeInfo.bucketId, fileSize });

    const taskId = generateUUID();
    const tasksClient = getTasksClient();

    await addTask({
      id: taskId,
      courseId,
      filename,
      fileSize,
      pubDate: processingDate ? new Date(processingDate) : undefined,
    });

    const scheduleTime = processingDate
      ? new Date(processingDate)
      : new Date(Date.now() + 70 * 1000); // 70 seconds from now

    const extFilename = `${courseId}/${filename}`;

    // Determine job type based on file type
    const jobType: JobType =
      fileType === "application/pdf" ? "process-pdf" : "process-document";

    // Schedule the processing task with cloud-agnostic interface
    await tasksClient.scheduleProcessingTask({
      taskId,
      jobType,
      payload: {
        taskId,
        bucketId: bucketSizeInfo.bucketId,
        name: extFilename,
        size: fileSize.toString(),
        contentType: fileType,
        pageNumberOffset,
        ...(pdfPipelineOptions && { pipelineOptions: pdfPipelineOptions }),
      },
      scheduleTime,
    });

    logger.debug("Processing task scheduled with pipeline options: ", {
      jobType,
      pdfPipelineOptions,
    });

    const storageClient = getStorageClient();

    const { url: signedUrl, headers } =
      await storageClient.getSignedUrlForUpload({
        bucket: "files-bucket",
        key: extFilename,
        contentType: "application/pdf",
        contentLength: fileSize,
      });

    logger.debug("SignedUrl generated:", { signedUrl, extFilename });

    return c.json({
      signedUrl,
      headers,
      extFilename,
      processingDate: processingDate || undefined,
    });
  }
);

export default app;
