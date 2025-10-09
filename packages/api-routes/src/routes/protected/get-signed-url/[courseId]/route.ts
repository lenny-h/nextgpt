import * as z from "zod";

import { increaseBucketSize } from "@workspace/api-routes/lib/db/queries/buckets.js";
import { isCourseMaintainer } from "@workspace/api-routes/lib/db/queries/course-maintainers.js";
import { getBucketSizeByCourseId } from "@workspace/api-routes/lib/db/queries/courses.js";
import { addTask } from "@workspace/api-routes/lib/db/queries/tasks.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { getSignedUrlForUpload } from "@workspace/api-routes/utils/access-clients/s3-client.js";
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
    return paramSchema.parse(value);
  }),
  validator("json", async (value, c) => {
    return getSignedUrlSchema.parse(value);
  }),
  async (c) => {
    const { courseId } = c.req.valid("param");

    const { filename, fileSize, processingDate } = c.req.valid("json");
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

    const projectId = process.env.GOOGLE_VERTEX_PROJECT!;
    const serviceAccountEmail = process.env.CLOUD_TASKS_SA!;
    const processorUrl = process.env.PROCESSOR_URL;
    const queuePath = process.env.TASK_QUEUE_PATH!;

    const tasksClient = getTasksClient();

    const taskId = generateUUID();
    const taskName = `pdf-process-${taskId}`;

    await addTask({
      id: taskId,
      courseId,
      filename,
      fileSize,
      pubDate: processingDate ? new Date(processingDate) : undefined,
    });

    const file = {
      taskId,
      bucket: bucketSizeInfo.bucketId,
      name: `${courseId}/${filename}`,
      size: fileSize,
      contentType: "application/pdf",
    };

    const queuePathParts = queuePath.split("/");
    const location = queuePathParts[3];
    const queue = queuePathParts.pop() || "";

    const scheduleTime = processingDate
      ? new Date(processingDate)
      : new Date(Date.now() + 60 * 1000); // 60 seconds from now

    const task = {
      name: tasksClient.taskPath(projectId, location, queue, taskName),
      httpRequest: {
        httpMethod: "POST" as const,
        url: processorUrl + "/process-pdf",
        headers: {
          "Content-Type": "application/json",
        },
        body: Buffer.from(JSON.stringify(file)).toString("base64"),
        oidcToken: {
          serviceAccountEmail: serviceAccountEmail,
        },
      },
      scheduleTime: {
        seconds: Math.floor(scheduleTime.getTime() / 1000),
      },
    };

    await tasksClient.createTask({
      parent: queuePath,
      task,
    });

    const extFilename = `${courseId}/${filename}`;

    const signedUrl = await getSignedUrlForUpload({
      bucket: `${projectId}-files-bucket`,
      key: extFilename,
      contentType: "application/pdf",
      contentLength: fileSize,
    });

    return c.json({
      signedUrl,
      extFilename,
      processingDate: processingDate || undefined,
    });
  }
);

export default app;
