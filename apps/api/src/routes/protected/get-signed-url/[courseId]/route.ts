import { CloudTasksClient } from "@google-cloud/tasks";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  getBucketSize,
  increaseBucketSize,
} from "../../../../lib/db/queries/buckets.js";
import { isCourseMaintainer } from "../../../../lib/db/queries/course-maintainers.js";
import { getBucketIdByCourseId } from "../../../../lib/db/queries/courses.js";
import { addTask } from "../../../../lib/db/queries/tasks.js";
import { uuidSchema } from "../../../../schemas/uuid-schema.js";
import { getSignedUrlForUpload } from "../../../../utils/access-clients/s3-client.js";
import { generateUUID } from "../../../../utils/utils.js";
import { getSignedUrlSchema } from "./schema.js";

export async function POST(c: Context) {
  const courseId = uuidSchema.parse(c.req.param("courseId"));

  const user = c.get("user");

  const isMaintainer = await isCourseMaintainer({
    userId: user.id,
    courseId,
  });

  if (!isMaintainer) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  const payload = await c.req.json();

  const { filename, fileSize, processingDate } =
    getSignedUrlSchema.parse(payload);

  if (processingDate && !Date.parse(processingDate)) {
    throw new HTTPException(400, { message: "Invalid processing date" });
  }

  const bucketId = await getBucketIdByCourseId({ courseId });
  const bucketSize = await getBucketSize({ bucketId });

  if (bucketSize.size + fileSize > bucketSize.maxSize) {
    throw new HTTPException(400, {
      message: `Bucket size exceeded. Current size: ${bucketSize.size}, max size: ${bucketSize.maxSize}`,
    });
  }

  await increaseBucketSize({ bucketId, fileSize });

  const projectId = process.env.GOOGLE_VERTEX_PROJECT!;
  const serviceAccountEmail = process.env.CLOUD_TASKS_SA;
  const processorUrl = process.env.PROCESSOR_URL;
  const queuePath = process.env.TASK_QUEUE_PATH!;

  const tasksClient = new CloudTasksClient();

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
    bucket: bucketId,
    name: `${courseId}/${filename}`,
    size: fileSize,
    contentType: "application/pdf",
  };

  const queuePathParts = queuePath.split("/");
  const location = queuePathParts[3];
  const queue = queuePathParts.pop() || "";

  const task: any = {
    name: tasksClient.taskPath(projectId, location, queue, taskName),
    httpRequest: {
      httpMethod: "POST",
      url: processorUrl + "/process-pdf",
      headers: {
        "Content-Type": "application/json",
      },
      body: Buffer.from(JSON.stringify(file)).toString("base64"),
      oidcToken: {
        serviceAccountEmail: serviceAccountEmail,
      },
    },
  };

  const scheduleTime = processingDate
    ? new Date(processingDate)
    : new Date(Date.now() + 80 * 1000); // 80 seconds from now

  task.scheduleTime = {
    seconds: Math.floor(scheduleTime.getTime() / 1000),
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
    processingDate: processingDate || null,
  });
}
