import * as z from "zod";

import { increaseBucketSize } from "@workspace/api-routes/lib/db/queries/buckets.js";
import { isCourseMaintainer } from "@workspace/api-routes/lib/db/queries/course-maintainers.js";
import { getBucketSizeByCourseId } from "@workspace/api-routes/lib/db/queries/courses.js";
import { addTask } from "@workspace/api-routes/lib/db/queries/tasks.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { getStorageClient } from "@workspace/api-routes/utils/access-clients/storage-client.js";
import { getTasksClient } from "@workspace/api-routes/utils/access-clients/tasks-client.js";
import { generateUUID } from "@workspace/api-routes/utils/utils.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { getSignedUrlSchema } from "./schema.js";

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

    const processorUrl = process.env.DOCUMENT_PROCESSOR_URL;
    if (!processorUrl) {
      throw new HTTPException(500, {
        message: "DOCUMENT_PROCESSOR_URL not configured",
      });
    }

    const tasksClient = getTasksClient();

    const taskId = generateUUID();

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

    // Schedule the processing task with cloud-agnostic interface
    await tasksClient.scheduleProcessingTask({
      taskId,
      processorUrl,
      endpoint:
        fileType === "application/pdf" ? "/process-pdf" : "/process-document",
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

    console.log("Processing task with pipeline options: ", {
      pdfPipelineOptions,
    });

    const storageClient = getStorageClient();

    const signedUrl = await storageClient.getSignedUrlForUpload({
      bucket: "files-bucket",
      key: extFilename,
      contentType: "application/pdf",
      contentLength: fileSize,
    });

    console.log("SignedUrl generated:", { signedUrl, extFilename });

    return c.json({
      signedUrl,
      extFilename,
      processingDate: processingDate || undefined,
    });
  }
);

export default app;
