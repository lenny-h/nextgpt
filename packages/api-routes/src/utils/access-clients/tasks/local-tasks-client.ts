import { createLogger } from "@workspace/server/logger.js";
import { spawn } from "node:child_process";
import {
  CancelTaskParams,
  ITasksClient,
  JobType,
  ScheduleProcessingTaskParams,
} from "../interfaces/tasks-client.interface.js";

const logger = createLogger("local-tasks-client");

/**
 * Local tasks client for development
 * Spawns the document processor job_runner.py as a subprocess
 */
export class LocalTasksClient implements ITasksClient {
  private scheduledTasks: Map<string, NodeJS.Timeout> = new Map();
  private runningProcesses: Map<string, ReturnType<typeof spawn>> = new Map();

  async scheduleProcessingTask(
    params: ScheduleProcessingTaskParams
  ): Promise<void> {
    const { taskId, jobType, payload, scheduleTime } = params;

    const delay = Math.max(0, scheduleTime.getTime() - Date.now());

    logger.debug(`Task scheduled with delay: ${delay}ms`);
    logger.debug(`Task ID: ${taskId}`);
    logger.debug(`Job Type: ${jobType}`);

    // Clear any existing timeout with the same name
    if (this.scheduledTasks.has(taskId)) {
      clearTimeout(this.scheduledTasks.get(taskId));
    }

    // Execute after delay
    const timeout = setTimeout(async () => {
      try {
        logger.info(`Executing task: ${taskId} (${jobType})`);

        await this.runJobProcess(taskId, jobType, payload);

        logger.info(`Task completed successfully`);
      } catch (error) {
        logger.error(`Task execution error:`, error);
      } finally {
        this.scheduledTasks.delete(taskId);
        this.runningProcesses.delete(taskId);
      }
    }, delay);

    // Store the timeout
    this.scheduledTasks.set(taskId, timeout);
  }

  private runJobProcess(
    taskId: string,
    jobType: JobType,
    payload: ScheduleProcessingTaskParams["payload"]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Build environment variables for the job
      const env: Record<string, string> = {
        ...process.env,
        JOB_TYPE: jobType,
        TASK_ID: payload.taskId,
        BUCKET_ID: payload.bucketId,
        FILE_NAME: payload.name,
        FILE_SIZE: payload.size,
        CONTENT_TYPE: payload.contentType || "application/pdf",
        PAGE_NUMBER_OFFSET: String(payload.pageNumberOffset || 0),
      };

      // Add pipeline options if present
      if (payload.pipelineOptions) {
        const opts = payload.pipelineOptions;
        if (opts.do_ocr !== undefined) {
          env.DO_OCR = String(opts.do_ocr);
        }
        if (opts.do_table_structure !== undefined) {
          env.DO_TABLE_STRUCTURE = String(opts.do_table_structure);
        }
        if (opts.do_formula_enrichment !== undefined) {
          env.DO_FORMULA_ENRICHMENT = String(opts.do_formula_enrichment);
        }
        if (opts.do_code_enrichment !== undefined) {
          env.DO_CODE_ENRICHMENT = String(opts.do_code_enrichment);
        }
        if (opts.do_picture_description !== undefined) {
          env.DO_PICTURE_DESCRIPTION = String(opts.do_picture_description);
        }
      }

      // Spawn the job_runner.py process
      const documentProcessorPath =
        process.env.DOCUMENT_PROCESSOR_PATH || "../document-processor/src";

      const proc = spawn("python", ["-m", "job_runner"], {
        cwd: documentProcessorPath,
        env: env as NodeJS.ProcessEnv,
        stdio: ["ignore", "pipe", "pipe"],
      });

      this.runningProcesses.set(taskId, proc);

      let stdout = "";
      let stderr = "";

      proc.stdout?.on("data", (data) => {
        const output = data.toString();
        stdout += output;
        logger.debug(`[${taskId}] stdout: ${output.trim()}`);
      });

      proc.stderr?.on("data", (data) => {
        const output = data.toString();
        stderr += output;
        // Log stderr as info since Python logs go there
        logger.info(`[${taskId}] ${output.trim()}`);
      });

      proc.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(
              `Job process exited with code ${code}\n${stderr || stdout}`
            )
          );
        }
      });

      proc.on("error", (error) => {
        reject(error);
      });
    });
  }

  async cancelTask(params: CancelTaskParams): Promise<void> {
    const { taskId } = params;

    logger.info(`Canceling task: ${taskId}`);

    // Cancel scheduled timeout
    if (this.scheduledTasks.has(taskId)) {
      clearTimeout(this.scheduledTasks.get(taskId));
      this.scheduledTasks.delete(taskId);
      logger.info(`Scheduled task canceled`);
    }

    // Kill running process
    if (this.runningProcesses.has(taskId)) {
      const proc = this.runningProcesses.get(taskId)!;
      proc.kill("SIGTERM");
      this.runningProcesses.delete(taskId);
      logger.info(`Running process terminated`);
    }

    if (
      !this.scheduledTasks.has(taskId) &&
      !this.runningProcesses.has(taskId)
    ) {
      logger.warn(`Task not found or already completed: ${taskId}`);
    }
  }

  /**
   * Clear all scheduled tasks and kill running processes
   */
  clearAll(): void {
    for (const timeout of this.scheduledTasks.values()) {
      clearTimeout(timeout);
    }
    this.scheduledTasks.clear();

    for (const proc of this.runningProcesses.values()) {
      proc.kill("SIGTERM");
    }
    this.runningProcesses.clear();

    logger.info("All scheduled tasks cleared");
  }

  /**
   * Get count of scheduled tasks
   */
  getScheduledTaskCount(): number {
    return this.scheduledTasks.size;
  }
}
