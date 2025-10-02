import { Hono } from "hono";
import { POST as attachmentsGetSignedUrlPost } from "./attachments/get-signed-url/route.js";
import {
  DELETE as bucketMaintainersDelete,
  GET as bucketMaintainersGet,
  POST as bucketMaintainersPost,
} from "./bucket-maintainers/[bucketId]/route.js";
import {
  DELETE as bucketUsersDelete,
  GET as bucketUsersGet,
  POST as bucketUsersPost,
} from "./bucket-users/[bucketId]/route.js";
import { GET as bucketUsersIlikeGet } from "./bucket-users/ilike/[bucketId]/route.js";
import { DELETE as bucketsDelete } from "./buckets/[bucketId]/route.js";
import { GET as bucketsMaintainedGet } from "./buckets/maintained/route.js";
import { POST as bucketsPost } from "./buckets/route.js";
import { GET as bucketsUsedGet } from "./buckets/used/route.js";
import {
  DELETE as chatDelete,
  PATCH as chatPatch,
  POST as chatPost,
} from "./chat/route.js";
import {
  GET as chatByIdGet,
  DELETE as chatsDelete,
} from "./chats/[chatId]/route.js";
import { GET as chatsFavouritesGet } from "./chats/favourites/route.js";
import { GET as chatsIlikeGet } from "./chats/ilike/route.js";
import {
  GET as chatsIsFavouriteGet,
  PATCH as chatsIsFavouritePatch,
} from "./chats/is-favourite/[chatId]/route.js";
import { GET as chatsGet } from "./chats/route.js";
import { PATCH as chatTitlePatch } from "./chats/title/[chatId]/route.js";
import { POST as completionPost } from "./completion/route.js";
import { POST as correctionGetSignedUrlPost } from "./correction/get-signed-url/route.js";
import { POST as correctionPost } from "./correction/route.js";
import {
  DELETE as courseMaintainersDelete,
  GET as courseMaintainersGet,
  POST as courseMaintainersPost,
} from "./course-maintainers/[courseId]/route.js";
import { GET as coursesByBucketGet } from "./courses/[bucketId]/route.js";
import { DELETE as courseDelete } from "./courses/[courseId]/route.js";
import { GET as coursesMaintainedGet } from "./courses/maintained/route.js";
import { POST as requestAccessPost } from "./courses/request-access/route.js";
import { POST as coursePost } from "./courses/route.js";
import { POST as validateAccessPost } from "./courses/validate-access/route.js";
import {
  DELETE as documentByIdDelete,
  GET as documentByIdGet,
} from "./documents/[documentId]/route.js";
import { PATCH as documentContentPatch } from "./documents/content/[documentId]/route.js";
import { GET as documentsIlikeGet } from "./documents/ilike/route.js";
import {
  POST as documentPost,
  GET as documentsGet,
} from "./documents/route.js";
import { PATCH as documentsTitlePatch } from "./documents/title/[documentId]/[title]/route.js";
import { POST as feedbackPost } from "./feedback/route.js";
import { DELETE as filesDelete } from "./files/[fileId]/route.js";
import { GET as filesIlikeGet } from "./files/ilike/route.js";
import { GET as filesGet } from "./files/route.js";
import { GET as getSignedUrlGet } from "./get-signed-url/[courseId]/[name]/route.js";
import { POST as getSignedUrlPost } from "./get-signed-url/[courseId]/route.js";
import { POST as acceptInvitationPost } from "./invitations/accept/route.js";
import { GET as incomingInvitationsGet } from "./invitations/incoming/route.js";
import { GET as outgoingInvitationsGet } from "./invitations/outgoing/route.js";
import { POST as rejectInvitationPost } from "./invitations/reject/route.js";
import { GET as messagesGet } from "./messages/[chatId]/route.js";
import { DELETE as lastMessageDelete } from "./messages/delete-last-message/[chatId]/route.js";
import { DELETE as trailingMessagesDelete } from "./messages/delete-trailing/[messageId]/route.js";
import { GET as modelsByBucketGet } from "./models/[bucketId]/route.js";
import { DELETE as modelDelete } from "./models/[modelId]/route.js";
import { POST as modelPost, GET as modelsGet } from "./models/route.js";
import { POST as practicePost } from "./practice/route.js";
import { POST as processCsvPost } from "./process-csv/[bucketId]/route.js";
import { GET as profilesIlikeGet } from "./profiles/ilike/route.js";
import {
  GET as profilesGet,
  PATCH as profilesPatch,
} from "./profiles/route.js";
import {
  DELETE as promptsDelete,
  PATCH as promptsPatch,
} from "./prompts/[promptId]/route.js";
import { GET as promptsGet, POST as promptsPost } from "./prompts/route.js";
import { POST as searchPost } from "./search/[query]/route.js";
import { GET as tasksByCourseGet } from "./tasks/[courseId]/route.js";
import { DELETE as tasksDelete } from "./tasks/[taskId]/route.js";

const protectedApiRouter = new Hono()
  // Attachments
  .post("/attachments/get-signed-url", attachmentsGetSignedUrlPost)

  // Bucket maintainers
  .get("/bucket-maintainers/:bucketId", bucketMaintainersGet)
  .post("/bucket-maintainers/:bucketId", bucketMaintainersPost)
  .delete("/bucket-maintainers/:bucketId", bucketMaintainersDelete)

  // Bucket users
  .get("/bucket-users/:bucketId", bucketUsersGet)
  .post("/bucket-users/:bucketId", bucketUsersPost)
  .delete("/bucket-users/:bucketId", bucketUsersDelete)
  .get("/bucket-users/ilike/:bucketId", bucketUsersIlikeGet)

  // Buckets
  .post("/buckets", bucketsPost)
  .delete("/buckets/:bucketId", bucketsDelete)
  .get("/buckets/maintained", bucketsMaintainedGet)
  .get("/buckets/used", bucketsUsedGet)

  // Chat
  .post("/chat", chatPost)
  .patch("/chat", chatPatch)
  .delete("/chat", chatDelete)

  // Chats
  .get("/chats", chatsGet)
  .get("/chats/:chatId", chatByIdGet)
  .delete("/chats/:chatId", chatsDelete)
  .get("/chats/favourites", chatsFavouritesGet)
  .get("/chats/ilike", chatsIlikeGet)
  .get("/chats/is-favourite/:chatId", chatsIsFavouriteGet)
  .patch("/chats/is-favourite/:chatId", chatsIsFavouritePatch)
  .patch("/chats/title/:chatId", chatTitlePatch)

  // Completion
  .post("/completion", completionPost)

  // Correction
  .post("/correction", correctionPost)
  .post("/correction/get-signed-url", correctionGetSignedUrlPost)

  // Course maintainers
  .get("/course-maintainers/:courseId", courseMaintainersGet)
  .post("/course-maintainers/:courseId", courseMaintainersPost)
  .delete("/course-maintainers/:courseId", courseMaintainersDelete)

  // Courses
  .post("/courses", coursePost)
  .get("/courses/:bucketId", coursesByBucketGet)
  .delete("/courses/:courseId", courseDelete)
  .get("/courses/maintained", coursesMaintainedGet)
  .post("/courses/request-access", requestAccessPost)
  .post("/courses/validate-access", validateAccessPost)

  // Documents
  .get("/documents", documentsGet)
  .post("/documents", documentPost)
  .get("/documents/:documentId", documentByIdGet)
  .delete("/documents/:documentId", documentByIdDelete)
  .patch("/documents/content/:documentId", documentContentPatch)
  .get("/documents/ilike", documentsIlikeGet)
  .patch("/documents/title/:documentId/:title", documentsTitlePatch)

  // Feedback
  .post("/feedback", feedbackPost)

  // Files
  .get("/files", filesGet)
  .delete("/files/:fileId", filesDelete)
  .get("/files/ilike", filesIlikeGet)

  // Get signed URL
  .post("/get-signed-url/:courseId", getSignedUrlPost)
  .get("/get-signed-url/:courseId/:name", getSignedUrlGet)

  // Invitations
  .post("/invitations/accept", acceptInvitationPost)
  .get("/invitations/incoming", incomingInvitationsGet)
  .get("/invitations/outgoing", outgoingInvitationsGet)
  .post("/invitations/reject", rejectInvitationPost)

  // Messages
  .get("/messages/:chatId", messagesGet)
  .delete("/messages/delete-last-message/:chatId", lastMessageDelete)
  .delete("/messages/delete-trailing/:messageId", trailingMessagesDelete)

  // Models
  .get("/models", modelsGet)
  .post("/models", modelPost)
  .get("/models/:bucketId", modelsByBucketGet)
  .delete("/models/:modelId", modelDelete)

  // Practice
  .post("/practice", practicePost)

  // Process CSV
  .post("/process-csv/:bucketId", processCsvPost)

  // Profiles
  .get("/profiles", profilesGet)
  .patch("/profiles", profilesPatch)
  .get("/profiles/ilike", profilesIlikeGet)

  // Prompts
  .get("/prompts", promptsGet)
  .post("/prompts", promptsPost)
  .delete("/prompts/:promptId", promptsDelete)
  .patch("/prompts/:promptId", promptsPatch)

  // Search
  .get("/search/:query", searchPost)

  // Tasks
  .get("/tasks/:courseId", tasksByCourseGet)
  .get("/tasks/:taskId", tasksDelete);

export { protectedApiRouter };
export type ProtectedApiType = typeof protectedApiRouter;
