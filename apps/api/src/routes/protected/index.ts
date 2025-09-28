import { Hono } from "hono";
import { POST as attachmentsGetSignedUrlPost } from "./attachments/get-signed-url/route.js";
import {
  DELETE as bucketMaintainersDelete,
  POST as bucketMaintainersPost,
} from "./bucket-maintainers/[bucketId]/route.js";
import { POST as bucketUsersPost } from "./bucket-users/[bucketId]/route.js";
import { DELETE as bucketDelete } from "./buckets/[bucketId]/route.js";
import { POST as bucketPost } from "./buckets/route.js";
import {
  DELETE as chatDelete,
  PATCH as chatPatch,
  POST as chatPost,
} from "./chat/route.js";
import { POST as completionPost } from "./completion/route.js";
import { POST as correctionGetSignedUrlPost } from "./correction/get-signed-url/route.js";
import { POST as correctionPost } from "./correction/route.js";
import {
  DELETE as courseMaintainersDelete,
  POST as courseMaintainersPost,
} from "./course-maintainers/[courseId]/route.js";
import { DELETE as courseDelete } from "./courses/[courseId]/route.js";
import { POST as requestAccessPost } from "./courses/request-access/route.js";
import { POST as coursePost } from "./courses/route.js";
import { POST as validateAccessPost } from "./courses/validate-access/route.js";
import { PATCH as documentPatch } from "./documents/[documentId]/route.js";
import { POST as documentPost } from "./documents/route.js";
import { DELETE as fileDelete } from "./file/[fileId]/route.js";
import { GET as getSignedUrlGet } from "./get-signed-url/[courseId]/[name]/route.js";
import { POST as getSignedUrlPost } from "./get-signed-url/[courseId]/route.js";
import { POST as acceptInvitationPost } from "./invitations/accept/route.js";
import { POST as rejectInvitationPost } from "./invitations/reject/route.js";
import { DELETE as lastMessageDelete } from "./messages/delete-last-message/[chatId]/route.js";
import { DELETE as trailingMessagesDelete } from "./messages/delete-trailing/[messageId]/route.js";
import { DELETE as modelDelete } from "./models/[modelId]/route.js";
import { POST as modelPost } from "./models/route.js";
import { POST as practicePost } from "./practice/route.js";
import { POST as processCsvPost } from "./process-csv/[bucketId]/route.js";
import { POST as promptPost } from "./prompts/route.js";
import { POST as searchPost } from "./search/[query]/route.js";
import { DELETE as taskDelete } from "./tasks/[taskId]/route.js";

const protectedApiRouter = new Hono();

// Register all route modules
protectedApiRouter.post(
  "/attachments/get-signed-url",
  attachmentsGetSignedUrlPost
);

protectedApiRouter.post("/bucket-maintainers/:bucketId", bucketMaintainersPost);
protectedApiRouter.delete(
  "/bucket-maintainers/:bucketId",
  bucketMaintainersDelete
);

protectedApiRouter.post("/bucket-users/:bucketId", bucketUsersPost);

protectedApiRouter.post("/buckets", bucketPost);
protectedApiRouter.delete("/buckets/:bucketId", bucketDelete);

protectedApiRouter.post("/chat", chatPost);
protectedApiRouter.patch("/chat", chatPatch);
protectedApiRouter.delete("/chat", chatDelete);

protectedApiRouter.post("/completion", completionPost);

protectedApiRouter.post("/correction", correctionPost);
protectedApiRouter.post(
  "/correction/get-signed-url",
  correctionGetSignedUrlPost
);

protectedApiRouter.post("/course-maintainers/:courseId", courseMaintainersPost);
protectedApiRouter.delete(
  "/course-maintainers/:courseId",
  courseMaintainersDelete
);

protectedApiRouter.post("/courses", coursePost);
protectedApiRouter.delete("/courses/:courseId", courseDelete);
protectedApiRouter.post("/courses/request-access", requestAccessPost);
protectedApiRouter.post("/courses/validate-access", validateAccessPost);

protectedApiRouter.post("/documents", documentPost);
protectedApiRouter.patch("/documents/:documentId", documentPatch);

protectedApiRouter.delete("/files/:fileId", fileDelete);

protectedApiRouter.post("/get-signed-url/:courseId", getSignedUrlPost);
protectedApiRouter.get("/get-signed-url/:courseId/:name", getSignedUrlGet);

protectedApiRouter.post("/invitations/accept", acceptInvitationPost);
protectedApiRouter.post("/invitations/reject", rejectInvitationPost);

protectedApiRouter.post(
  "/messages/delete-last-message/:chatId",
  lastMessageDelete
);
protectedApiRouter.post(
  "/messages/delete-trailing/:messageId",
  trailingMessagesDelete
);

protectedApiRouter.post("/models", modelPost);
protectedApiRouter.delete("/models/:modelId", modelDelete);

protectedApiRouter.post("/practice", practicePost);

protectedApiRouter.post("/process-csv/:bucketId", processCsvPost);

protectedApiRouter.post("/prompts", promptPost);

protectedApiRouter.post("/search/:query", searchPost);

protectedApiRouter.delete("/tasks/:taskId", taskDelete);

export { protectedApiRouter };
