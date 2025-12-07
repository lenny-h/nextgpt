import * as z from "zod";

import { isCourseMaintainer } from "@workspace/api-routes/lib/db/queries/course-maintainers.js";
import {
  deleteTask,
  getTaskDetails,
} from "@workspace/api-routes/lib/db/queries/tasks.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { getStorageClient } from "@workspace/api-routes/utils/access-clients/storage-client.js";
import { getTasksClient } from "@workspace/api-routes/utils/access-clients/tasks-client.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ taskId: uuidSchema }).strict();

const app = new Hono().delete(
  "/",
  validator("param", (value, c) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
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

    // For finished/failed tasks, just delete the DB entry
    if (status === "finished" || status === "failed") {
      await deleteTask({
        taskId,
      });
      return c.json({ name });
    }

    // For scheduled tasks, also cancel the task and delete the file
    if (status !== "scheduled") {
      throw new HTTPException(400, {
        message: "ONLY_SCHEDULED_OR_COMPLETED_TASKS",
      });
    }

    const tasksClient = getTasksClient();

    // Cancel the scheduled task using cloud-agnostic interface
    const taskCancelled = await tasksClient.cancelTask({ taskId });

    await deleteTask({
      taskId,
    });

    if (taskCancelled) {
      const storageClient = getStorageClient();

      await storageClient.deleteFile({
        bucket: "files-bucket",
        key: `${courseId}/${name}`,
      });
    }

    return c.json({ name });
  }
);

export default app;
