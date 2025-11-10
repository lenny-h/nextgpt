import { relations } from "drizzle-orm";
import {
  account,
  bucketMaintainerInvitations,
  bucketUserRoles,
  buckets,
  chats,
  chunks,
  courseKeys,
  courseMaintainerInvitations,
  courseUserRoles,
  courses,
  documents,
  feedback,
  files,
  messages,
  models,
  prompts,
  ssoProvider,
  tasks,
  toolCallDocuments,
  user,
  userInvitations,
} from "./schema.js";

export const userRelations = relations(user, ({ many, one }) => ({
  accounts: many(account),
  ownedBuckets: many(buckets),
  bucketMemberships: many(bucketUserRoles),
  chats: many(chats),
  courseMemberships: many(courseUserRoles),
  documents: many(documents),
  feedback: many(feedback),
  userInvitations: many(userInvitations),
  bucketMaintainerInvitations: many(bucketMaintainerInvitations),
  courseMaintainerInvitations: many(courseMaintainerInvitations),
  prompts: many(prompts),
  ssoProviders: many(ssoProvider),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const ssoProviderRelations = relations(ssoProvider, ({ one }) => ({
  user: one(user, {
    fields: [ssoProvider.userId],
    references: [user.id],
  }),
}));

export const bucketsRelations = relations(buckets, ({ one, many }) => ({
  owner: one(user, {
    fields: [buckets.owner],
    references: [user.id],
  }),
  users: many(bucketUserRoles),
  courses: many(courses),
  userInvitations: many(userInvitations),
  bucketMaintainerInvitations: many(bucketMaintainerInvitations),
  models: many(models),
}));

export const bucketUserRolesRelations = relations(
  bucketUserRoles,
  ({ one }) => ({
    bucket: one(buckets, {
      fields: [bucketUserRoles.bucketId],
      references: [buckets.id],
    }),
    user: one(user, {
      fields: [bucketUserRoles.userId],
      references: [user.id],
    }),
  })
);

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(user, {
    fields: [chats.userId],
    references: [user.id],
  }),
  messages: many(messages),
  toolCallDocuments: many(toolCallDocuments),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  bucket: one(buckets, {
    fields: [courses.bucketId],
    references: [buckets.id],
  }),
  users: many(courseUserRoles),
  keys: many(courseKeys),
  files: many(files),
  chunks: many(chunks),
  courseMaintainerInvitations: many(courseMaintainerInvitations),
  tasks: many(tasks),
}));

export const courseUserRolesRelations = relations(
  courseUserRoles,
  ({ one }) => ({
    course: one(courses, {
      fields: [courseUserRoles.courseId],
      references: [courses.id],
    }),
    user: one(user, {
      fields: [courseUserRoles.userId],
      references: [user.id],
    }),
  })
);

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(user, {
    fields: [documents.userId],
    references: [user.id],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(user, {
    fields: [feedback.userId],
    references: [user.id],
  }),
}));

export const filesRelations = relations(files, ({ one, many }) => ({
  course: one(courses, {
    fields: [files.courseId],
    references: [courses.id],
  }),
  chunks: many(chunks),
}));

export const chunksRelations = relations(chunks, ({ one }) => ({
  file: one(files, {
    fields: [chunks.fileId],
    references: [files.id],
  }),
  course: one(courses, {
    fields: [chunks.courseId],
    references: [courses.id],
  }),
}));

export const userInvitationsRelations = relations(
  userInvitations,
  ({ one }) => ({
    originUser: one(user, {
      fields: [userInvitations.origin],
      references: [user.id],
    }),
    targetUser: one(user, {
      fields: [userInvitations.target],
      references: [user.id],
    }),
    bucket: one(buckets, {
      fields: [userInvitations.bucketId],
      references: [buckets.id],
    }),
  })
);

export const bucketMaintainerInvitationsRelations = relations(
  bucketMaintainerInvitations,
  ({ one }) => ({
    originUser: one(user, {
      fields: [bucketMaintainerInvitations.origin],
      references: [user.id],
    }),
    targetUser: one(user, {
      fields: [bucketMaintainerInvitations.target],
      references: [user.id],
    }),
    bucket: one(buckets, {
      fields: [bucketMaintainerInvitations.bucketId],
      references: [buckets.id],
    }),
  })
);

export const courseMaintainerInvitationsRelations = relations(
  courseMaintainerInvitations,
  ({ one }) => ({
    originUser: one(user, {
      fields: [courseMaintainerInvitations.origin],
      references: [user.id],
    }),
    targetUser: one(user, {
      fields: [courseMaintainerInvitations.target],
      references: [user.id],
    }),
    course: one(courses, {
      fields: [courseMaintainerInvitations.courseId],
      references: [courses.id],
    }),
  })
);

export const tasksRelations = relations(tasks, ({ one }) => ({
  course: one(courses, {
    fields: [tasks.courseId],
    references: [courses.id],
  }),
}));

export const promptsRelations = relations(prompts, ({ one }) => ({
  user: one(user, {
    fields: [prompts.userId],
    references: [user.id],
  }),
}));

export const modelsRelations = relations(models, ({ one }) => ({
  bucket: one(buckets, {
    fields: [models.bucketId],
    references: [buckets.id],
  }),
}));

export const courseKeysRelations = relations(courseKeys, ({ one }) => ({
  course: one(courses, {
    fields: [courseKeys.courseId],
    references: [courses.id],
  }),
}));

export const toolCallDocumentsRelations = relations(
  toolCallDocuments,
  ({ one }) => ({
    message: one(chats, {
      fields: [toolCallDocuments.chatId],
      references: [chats.id],
    }),
    user: one(user, {
      fields: [toolCallDocuments.userId],
      references: [user.id],
    }),
  })
);
