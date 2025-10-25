import * as z from "zod";

import { isCourseMaintainer } from "@workspace/api-routes/lib/db/queries/course-maintainers.js";
import {
  deleteTask,
  getTaskDetails,
} from "@workspace/api-routes/lib/db/queries/tasks.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { getTasksClient } from "@workspace/api-routes/utils/access-clients/tasks-client.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { getStorageClient } from "@workspace/api-routes/utils/access-clients/storage-client.js";

const paramSchema = z.object({ taskId: uuidSchema }).strict();

const app = new Hono().delete(
  "/",
  validator("param", (value) => {
    return paramSchema.parse(value);
  }),
  async (c) => {
    const { taskId } = c.req.valid("param");

    const user = c.get("user");

    const { courseId, name, status } = await getTaskDetails({
      taskId,
    });

    const isMaintainer = await isCourseMaintainer({
      userId: user.id,
      courseId,
    });

    if (!isMaintainer) {
      throw new HTTPException(403, { message: "FORBIDDEN" });
    }

    if (status !== "scheduled") {
      throw new HTTPException(400, {
        message: "ONLY_SCHEDULED_TASKS",
      });
    }

    const tasksClient = getTasksClient();
    const taskQueuePath = process.env.TASK_QUEUE_PATH!;

    const queuePathParts = taskQueuePath.split("/");
    const location = queuePathParts[3];
    const queue = queuePathParts.pop()!;

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

    const storageClient = getStorageClient();

    await storageClient.deleteFile({
      bucket: "files-bucket",
      key: `${courseId}/${name}`,
    });

    return c.json({ name });
  }
);

export default app;
