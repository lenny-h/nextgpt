import { CloudTasksClient } from "@google-cloud/tasks";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { isCourseMaintainer } from "../../../../lib/db/queries/course-maintainers.js";
import {
  deleteTask,
  getTaskDetails,
} from "../../../../lib/db/queries/tasks.js";
import { uuidSchema } from "../../../../schemas/uuid-schema.js";
import { deleteFileFromS3 } from "../../../../utils/access-clients/s3-client.js";

export async function DELETE(c: Context) {
  const taskId = uuidSchema.parse(c.req.param("taskId"));

  const user = c.get("user");

  const { courseId, name, status } = await getTaskDetails({
    taskId,
  });

  const isMaintainer = await isCourseMaintainer({
    userId: user.id,
    courseId,
  });

  if (!isMaintainer) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  if (status !== "scheduled") {
    throw new HTTPException(400, {
      message: "Only tasks with status 'scheduled' can be deleted",
    });
  }

  const tasksClient = new CloudTasksClient();
  const taskQueuePath = process.env.TASK_QUEUE_PATH!;

  const queuePathParts = taskQueuePath.split("/");
  const location = queuePathParts[3];
  const queue = queuePathParts.pop() || "";

  const taskName = `pdf-process-${taskId}`;
  const formattedTaskName = tasksClient.taskPath(
    process.env.GOOGLE_VERTEX_PROJECT!,
    location,
    queue,
    taskName
  );

  await tasksClient.deleteTask({ name: formattedTaskName });

  await deleteTask({
    taskId,
  });

  await deleteFileFromS3({
    bucket: `${process.env.GOOGLE_VERTEX_PROJECT}-files-bucket`,
    key: `${courseId}/${name}`,
  });

  return c.json({ name });
}
