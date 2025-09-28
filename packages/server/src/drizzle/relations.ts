import { relations } from "drizzle-orm";
import {
  account,
  bucketMaintainerInvitations,
  bucketMaintainers,
  buckets,
  bucketUsers,
  chats,
  courseKeys,
  courseMaintainerInvitations,
  courseMaintainers,
  courses,
  courseUsers,
  documents,
  feedback,
  files,
  messages,
  models,
  pages,
  prompts,
  session,
  tasks,
  user,
  userInvitations,
} from "./schema.js";

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  ownedBuckets: many(buckets),
  bucketMaintainerships: many(bucketMaintainers),
  bucketMemberships: many(bucketUsers),
  chats: many(chats),
  courseMaintainerships: many(courseMaintainers),
  courseMemberships: many(courseUsers),
  documents: many(documents),
  feedback: many(feedback),
  userInvitations: many(userInvitations),
  bucketMaintainerInvitations: many(bucketMaintainerInvitations),
  courseMaintainerInvitations: many(courseMaintainerInvitations),
  prompts: many(prompts),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const bucketsRelations = relations(buckets, ({ one, many }) => ({
  owner: one(user, {
    fields: [buckets.owner],
    references: [user.id],
  }),
  users: many(bucketUsers),
  maintainers: many(bucketMaintainers),
  courses: many(courses),
  userInvitations: many(userInvitations),
  bucketMaintainerInvitations: many(bucketMaintainerInvitations),
  models: many(models),
}));

export const bucketMaintainersRelations = relations(
  bucketMaintainers,
  ({ one }) => ({
    bucket: one(buckets, {
      fields: [bucketMaintainers.bucketId],
      references: [buckets.id],
    }),
    user: one(user, {
      fields: [bucketMaintainers.userId],
      references: [user.id],
    }),
  })
);

export const bucketUsersRelations = relations(bucketUsers, ({ one }) => ({
  bucket: one(buckets, {
    fields: [bucketUsers.bucketId],
    references: [buckets.id],
  }),
  user: one(user, {
    fields: [bucketUsers.userId],
    references: [user.id],
  }),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(user, {
    fields: [chats.userId],
    references: [user.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
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
  users: many(courseUsers),
  maintainers: many(courseMaintainers),
  keys: many(courseKeys),
  files: many(files),
  pages: many(pages),
  courseMaintainerInvitations: many(courseMaintainerInvitations),
  tasks: many(tasks),
}));

export const courseUsersRelations = relations(courseUsers, ({ one }) => ({
  course: one(courses, {
    fields: [courseUsers.courseId],
    references: [courses.id],
  }),
  user: one(user, {
    fields: [courseUsers.userId],
    references: [user.id],
  }),
}));

export const courseKeysRelations = relations(courseKeys, ({ one }) => ({
  course: one(courses, {
    fields: [courseKeys.courseId],
    references: [courses.id],
  }),
}));

export const courseMaintainersRelations = relations(
  courseMaintainers,
  ({ one }) => ({
    course: one(courses, {
      fields: [courseMaintainers.courseId],
      references: [courses.id],
    }),
    user: one(user, {
      fields: [courseMaintainers.userId],
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
  pages: many(pages),
}));

export const pagesRelations = relations(pages, ({ one }) => ({
  file: one(files, {
    fields: [pages.fileId],
    references: [files.id],
  }),
  course: one(courses, {
    fields: [pages.courseId],
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
