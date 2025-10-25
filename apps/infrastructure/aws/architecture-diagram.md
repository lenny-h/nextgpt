# AWS Task Scheduling Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Application Flow                               │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────┐
    │   User / Client      │
    └──────────┬───────────┘
               │
               │ HTTP Request
               ▼
    ┌──────────────────────┐
    │   Load Balancer      │
    │   (ALB)              │
    └──────────┬───────────┘
               │
               │ Route to API
               ▼
    ┌────────────────────────────────────────────────────────────┐
    │   API Service (ECS Fargate)                                │
    │   ┌──────────────────────────────────────────────────┐     │
    │   │  AwsTasksClient                                  │     │
    │   │  • createTask() - Schedule for future execution  │     │
    │   │  • deleteTask() - Cancel scheduled task          │     │
    │   └──────────────────────────────────────────────────┘     │
    └───────────────────┬────────────────────────────────────────┘
                        │
                        │ Create/Delete Schedule
                        ▼
    ┌────────────────────────────────────────────────────────────┐
    │   EventBridge Scheduler                                    │
    │   • Stores scheduled tasks                                 │
    │   • Supports delays up to 1 year                           │
    │   • Can delete before execution                            │
    │   • Auto-deletes after execution                           │
    └───────────────────┬────────────────────────────────────────┘
                        │
                        │ At scheduled time
                        │ (sends message directly)
                        ▼
    ┌────────────────────────────────────────────────────────────┐
    │   SQS Queue                                                │
    │   • document-processing-queue                              │
    │   • Buffers messages for workers                           │
    │   • Also receives immediate (non-scheduled) tasks          │
    └───────────────────┬────────────────────────────────────────┘
                        │
                        │ Polls for messages
                        ▼
    ┌────────────────────────────────────────────────────────────┐
    │   Document Processor (ECS Fargate)                         │
    │   • Runs in private subnet (no public access)              │
    │   • Processes tasks from SQS                               │
    │   • Makes HTTP requests to configured endpoints            │
    └────────────────────────────────────────────────────────────┘
```

## Task Flow for Scheduled Tasks

### Creating a Scheduled Task

```
1. Client Request
   POST /api/tasks
   {
     "executeAt": "2024-10-25T14:00:00Z",
     "url": "https://internal-service/process",
     "method": "POST",
     "data": {...}
   }

2. API Creates Schedule
   EventBridge Scheduler
   ├── Schedule Name: task_abc123
   ├── Schedule Time: 2024-10-25T14:00:00Z
   ├── Target: SQS Queue ARN
   └── Message: Task data

3. Schedule Waits
   (Can be cancelled anytime via deleteTask())

4. At Scheduled Time
   EventBridge → SQS
   Message appears in queue

5. Worker Processes
   Document Processor polls SQS
   ├── Receives message
   ├── Makes HTTP request
   └── Deletes message from queue

6. Auto-Cleanup
   Schedule automatically deleted by EventBridge
```

### Cancelling a Scheduled Task

```
1. Client Request
   DELETE /api/tasks/task_abc123

2. API Deletes Schedule
   EventBridge Scheduler
   └── Delete schedule: task_abc123

3. Task Cancelled
   Message never sent to SQS
   Task never executes
```

## IAM Permissions Flow

```
┌─────────────────────────────────────────────────────────────┐
│  API Task Role                                              │
│  ├── scheduler:CreateSchedule                               │
│  ├── scheduler:DeleteSchedule                               │
│  ├── scheduler:GetSchedule                                  │
│  ├── iam:PassRole (for EventBridge Scheduler Role)          │
│  └── sqs:SendMessage (for immediate tasks)                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Passes role when creating schedule
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  EventBridge Scheduler Role                                 │
│  └── sqs:SendMessage                                        │
│      (Only to document-processing-queue)                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Sends message at scheduled time
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  SQS Queue                                                  │
│  (document-processing-queue)                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Polls for messages
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Document Processor Task Role                               │
│  ├── sqs:ReceiveMessage                                     │
│  ├── sqs:DeleteMessage                                      │
│  └── sqs:GetQueueAttributes                                 │
└─────────────────────────────────────────────────────────────┘
```

## Comparison: Immediate vs Scheduled Tasks

### Immediate Task

```
API → SQS → Document Processor
     (< 15 min delay)
```

### Scheduled Task

```
API → EventBridge Scheduler → SQS → Document Processor
     (up to 1 year delay)
```
