import "@workspace/server/types/hono.js";
import { Hono } from "hono";

// Import handlers
import attachmentsGetSignedUrlRoute from "./attachments/get-signed-url/route.js";
import bucketMaintainersRoute from "./bucket-maintainers/[bucketId]/route.js";
import bucketUsersRoute from "./bucket-users/[bucketId]/route.js";
import bucketUsersIlikeRoute from "./bucket-users/ilike/[bucketId]/route.js";
import bucketsDeleteRoute from "./buckets/[bucketId]/route.js";
import bucketsUserCountRoute from "./buckets/[bucketId]/user-count/route.js";
import bucketsMaintainedRoute from "./buckets/maintained/route.js";
import bucketsRoute from "./buckets/route.js";
import bucketsUsedRoute from "./buckets/used/route.js";
import chatRoute from "./chat/route.js";
import chatsByIdRoute from "./chats/[chatId]/route.js";
import chatsFavourites from "./chats/favourites/route.js";
import chatsIlike from "./chats/ilike/route.js";
import chatsIsFavouriteRoute from "./chats/is-favourite/[chatId]/route.js";
import chatsRoute from "./chats/route.js";
import chatsTitleRoute from "./chats/title/[chatId]/route.js";
import completionRoute from "./completion/route.js";
import correctionGetSignedUrlRoute from "./correction/get-signed-url/route.js";
import correctionRoute from "./correction/route.js";
import courseMaintainersRoute from "./course-maintainers/[courseId]/route.js";
import coursesByBucketRoute from "./courses/[bucketId]/route.js";
import courseDeleteRoute from "./courses/[courseId]/route.js";
import coursesIlikeRoute from "./courses/ilike/[bucketId]/route.js";
import coursesMaintainedRoute from "./courses/maintained/route.js";
import requestAccessRoute from "./courses/request-access/route.js";
import courseRoute from "./courses/route.js";
import validateAccessRoute from "./courses/validate-access/route.js";
import documentByIdRoute from "./documents/[documentId]/route.js";
import documentContentRoute from "./documents/content/[documentId]/route.js";
import documentsIlike from "./documents/ilike/route.js";
import documentsRoute from "./documents/route.js";
import documentsTitleRoute from "./documents/title/[documentId]/[title]/route.js";
import feedbackRoute from "./feedback/route.js";
import filesByCourseRoute from "./files/[courseId]/route.js";
import filesDeleteRoute from "./files/[fileId]/route.js";
import filesIlike from "./files/ilike/route.js";
import filesRoute from "./files/route.js";
import filterRoute from "./filter/[chatId]/route.js";
import getSignedUrlNameRoute from "./get-signed-url/[courseId]/[name]/route.js";
import getSignedUrlRoute from "./get-signed-url/[courseId]/route.js";
import acceptInvitationRoute from "./invitations/accept/route.js";
import incomingInvitationsRoute from "./invitations/incoming/route.js";
import outgoingInvitationsRoute from "./invitations/outgoing/route.js";
import rejectInvitationRoute from "./invitations/reject/route.js";
import messagesRoute from "./messages/[chatId]/route.js";
import trailingMessagesRoute from "./messages/delete-trailing/[messageId]/route.js";
import modelsByBucketRoute from "./models/[bucketId]/route.js";
import modelDeleteRoute from "./models/[modelId]/route.js";
import modelsRoute from "./models/route.js";
import practiceRoute from "./practice/route.js";
import processCsvRoute from "./process-csv/[bucketId]/route.js";
import profilesIlike from "./profiles/ilike/route.js";
import profilesRoute from "./profiles/route.js";
import promptsDeleteRoute from "./prompts/[promptId]/route.js";
import promptsRoute from "./prompts/route.js";
import searchRoute from "./search/[query]/route.js";
import tasksByCourseRoute from "./tasks/[courseId]/route.js";
import tasksDeleteRoute from "./tasks/[taskId]/route.js";
import toolCallDocumentRoute from "./tool-call-documents/[documentId]/route.js";

// Important: Move routes with slugs to the end to prevent route conflicts

const protectedApiRouter = new Hono()
  // Attachments
  .route("/attachments/get-signed-url", attachmentsGetSignedUrlRoute)

  // Bucket maintainers
  .route("/bucket-maintainers/:bucketId", bucketMaintainersRoute)

  // Bucket users
  .route("/bucket-users/ilike/:bucketId", bucketUsersIlikeRoute)
  .route("/bucket-users/:bucketId", bucketUsersRoute)

  // Buckets
  .route("/buckets", bucketsRoute)
  .route("/buckets/maintained", bucketsMaintainedRoute)
  .route("/buckets/used", bucketsUsedRoute)
  .route("/buckets/:bucketId", bucketsDeleteRoute)
  .route("/buckets/:bucketId/user-count", bucketsUserCountRoute)

  // Chat
  .route("/chat", chatRoute)

  // Chats
  .route("/chats", chatsRoute)
  .route("/chats/favourites", chatsFavourites)
  .route("/chats/ilike", chatsIlike)
  .route("/chats/is-favourite/:chatId", chatsIsFavouriteRoute)
  .route("/chats/title/:chatId", chatsTitleRoute)
  .route("/chats/:chatId", chatsByIdRoute)

  // Completion
  .route("/completion", completionRoute)

  // Correction
  .route("/correction", correctionRoute)
  .route("/correction/get-signed-url", correctionGetSignedUrlRoute)

  // Course maintainers
  .route("/course-maintainers/:courseId", courseMaintainersRoute)

  // Courses
  .route("/courses", courseRoute)
  .route("/courses/ilike/:bucketId", coursesIlikeRoute)
  .route("/courses/maintained", coursesMaintainedRoute)
  .route("/courses/request-access", requestAccessRoute)
  .route("/courses/validate-access", validateAccessRoute)
  .route("/courses/:bucketId", coursesByBucketRoute)
  .route("/courses/:courseId", courseDeleteRoute)

  // Documents
  .route("/documents", documentsRoute)
  .route("/documents/content/:documentId", documentContentRoute)
  .route("/documents/ilike", documentsIlike)
  .route("/documents/title/:documentId/:title", documentsTitleRoute)
  .route("/documents/:documentId", documentByIdRoute)

  // Feedback
  .route("/feedback", feedbackRoute)

  // Filter
  .route("/filter/:chatId", filterRoute)

  // Files
  .route("/files", filesRoute)
  .route("/files/ilike", filesIlike)
  .route("/files/:courseId", filesByCourseRoute)
  .route("/files/:fileId", filesDeleteRoute)

  // Get signed URL
  .route("/get-signed-url/:courseId", getSignedUrlRoute)
  .route("/get-signed-url/:courseId/:name", getSignedUrlNameRoute)

  // Invitations
  .route("/invitations/accept", acceptInvitationRoute)
  .route("/invitations/incoming", incomingInvitationsRoute)
  .route("/invitations/outgoing", outgoingInvitationsRoute)
  .route("/invitations/reject", rejectInvitationRoute)

  // Messages
  .route("/messages/delete-trailing/:messageId", trailingMessagesRoute)
  .route("/messages/:chatId", messagesRoute)

  // Models
  .route("/models", modelsRoute)
  .route("/models/:bucketId", modelsByBucketRoute)
  .route("/models/:modelId", modelDeleteRoute)

  // Practice
  .route("/practice", practiceRoute)

  // Process CSV
  .route("/process-csv/:bucketId", processCsvRoute)

  // Profiles
  .route("/profiles", profilesRoute)
  .route("/profiles/ilike", profilesIlike)

  // Prompts
  .route("/prompts", promptsRoute)
  .route("/prompts/:promptId", promptsDeleteRoute)

  // Search
  .route("/search/:query", searchRoute)

  // Tasks
  .route("/tasks/:courseId", tasksByCourseRoute)
  .route("/tasks/:taskId", tasksDeleteRoute)

  // Tool call documents
  .route("/tool-call-documents/:documentId", toolCallDocumentRoute);

export { protectedApiRouter };
export type ProtectedApiType = typeof protectedApiRouter;
