# Access Clients

This directory contains client wrappers for external services. The tasks client can be mocked locally for development, since otherwise document-processor would need to be running on the cloud.

## Tasks Client

### Usage

```typescript
import { getTasksClient } from "@workspace/api-routes/utils/access-clients/tasks-client.js";

const tasksClient = getTasksClient();
await tasksClient.createTask({ ... });
```

### Local Development

The tasks client automatically detects when running locally and uses a mock implementation that simulates task scheduling and execution using `setTimeout`. Locally, tasks cannot be cancelled after creation.

**Enable local mode:**

Set environment variable:

- `USE_LOCAL_TASKS=true`

### Testing Delayed Tasks

```typescript
// Task scheduled 30 seconds from now
const scheduleTime = new Date(Date.now() + 30 * 1000);

await tasksClient.createTask({
  parent: queuePath,
  task: {
    scheduleTime: {
      seconds: Math.floor(scheduleTime.getTime() / 1000),
    },
    // ... rest of config
  },
});

// Console output:
// [LocalTasksClient] Task scheduled with delay: 30000ms
// [LocalTasksClient] Target URL: http://localhost:3006/process-pdf
// ... (30 seconds later)
// [LocalTasksClient] Executing task: pdf-process-xxx
// [LocalTasksClient] Task completed successfully
```

## Other Clients

- **s3-client.ts**: Cloudflare R2 client
- **google-storage-client.ts**: Google Cloud Storage client
