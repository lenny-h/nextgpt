import { InferSelectModel, SQL, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  customType,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";

// Users table
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
});

export type User = InferSelectModel<typeof user>;

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// Enums
export const bucketTypeEnum = pgEnum("bucket_type", [
  "small",
  "medium",
  "large",
  "org",
]);
export const roleEnum = pgEnum("role", ["user", "assistant", "system"]);
export const documentKindEnum = pgEnum("document_kind", ["code", "text"]);
export const taskStatusEnum = pgEnum("task_status", [
  "scheduled",
  "processing",
  "failed",
  "finished",
]);

// Buckets table
export const buckets = pgTable(
  "buckets",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    owner: uuid("owner")
      .notNull()
      .references(() => user.id),
    name: varchar("name", { length: 128 }).notNull(),
    size: bigint("size", { mode: "number" }).notNull().default(0),
    maxSize: bigint("max_size", { mode: "number" }).notNull(),
    type: bucketTypeEnum("type").notNull(),
    usersCount: smallint("users_count").notNull().default(0),
    subscriptionId: varchar("subscription_id", { length: 128 })
      .notNull()
      .default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("buckets_owner_name_unique").on(table.owner, table.name),
  ]
);

export type Bucket = InferSelectModel<typeof buckets>;

// Bucket maintainers table
export const bucketMaintainers = pgTable(
  "bucket_maintainers",
  {
    bucketId: uuid("bucket_id")
      .notNull()
      .references(() => buckets.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.bucketId, table.userId] })]
);

export type BucketMaintainer = InferSelectModel<typeof bucketMaintainers>;

// Bucket users table
export const bucketUsers = pgTable(
  "bucket_users",
  {
    bucketId: uuid("bucket_id")
      .notNull()
      .references(() => buckets.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.bucketId, table.userId] })]
);

export type BucketUser = InferSelectModel<typeof bucketUsers>;

// Chats table
export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 128 }).notNull(),
  isFavourite: boolean("is_favourite").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Chat = InferSelectModel<typeof chats>;

// Messages table
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  role: roleEnum("role").notNull(),
  parts: json("parts").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Message = InferSelectModel<typeof messages>;

// Courses table
export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    name: varchar("name", { length: 128 }).notNull(),
    description: text("description"),
    bucketId: uuid("bucket_id")
      .notNull()
      .references(() => buckets.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    private: boolean("private").notNull().default(false),
  },
  (table) => [unique().on(table.bucketId, table.name)]
);

export type Course = InferSelectModel<typeof courses>;

// Course users table
export const courseUsers = pgTable(
  "course_users",
  {
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.courseId, table.userId] })]
);

export type CourseUser = InferSelectModel<typeof courseUsers>;

// Course keys table
export const courseKeys = pgTable(
  "course_keys",
  {
    courseId: uuid("course_id").notNull(),
    key: varchar("key", { length: 256 }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.courseId] })]
);

export type CourseKey = InferSelectModel<typeof courseKeys>;

// Course maintainers table
export const courseMaintainers = pgTable(
  "course_maintainers",
  {
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.courseId, table.userId] })]
);

export type CourseMaintainer = InferSelectModel<typeof courseMaintainers>;

// Documents table
export const documents = pgTable(
  "documents",
  {
    id: uuid("id").notNull().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 128 }).notNull(),
    content: text("content").notNull(),
    kind: documentKindEnum("kind").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.createdAt] }),
    unique().on(table.userId, table.title),
  ]
);

export type Document = InferSelectModel<typeof documents>;

// Feedback table
export const feedback = pgTable(
  "feedback",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    subject: varchar("subject", { length: 128 }).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.createdAt] })]
);

export type Feedback = InferSelectModel<typeof feedback>;

// Files table
export const files = pgTable(
  "files",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id),
    name: varchar("name", { length: 128 }).notNull(),
    size: integer("size").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.courseId, table.name)]
);

export type File = InferSelectModel<typeof files>;

export const tsvector = customType<{
  data: string;
}>({
  dataType() {
    return `tsvector`;
  },
});

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").notNull(),
    fileId: uuid("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    fileName: varchar("file_name", { length: 128 }).notNull(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id),
    courseName: varchar("course_name", { length: 128 }).notNull(),
    embedding: vector("embedding", { dimensions: 768 }).notNull(),
    content: text("content").notNull(),
    pageIndex: smallint("page_index").notNull(),
    pageNumber: smallint("page_number"),
    chapter: smallint("chapter"),
    subChapter: smallint("sub_chapter"),
    fts: tsvector("fts")
      .notNull()
      .generatedAlwaysAs(
        (): SQL => sql`to_tsvector('english', ${pages.content})`
      ),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.courseId] }),
    index("idx_content_search").using("gin", table.fts),
    // index("content_search_index").using(
    //   "gin",
    //   sql`to_tsvector('english', ${table.content})`
    // ),
  ]
);

export type Page = InferSelectModel<typeof pages>;

// User invitations table
export const userInvitations = pgTable(
  "user_invitations",
  {
    origin: uuid("origin")
      .notNull()
      .references(() => user.id),
    target: uuid("target")
      .notNull()
      .references(() => user.id),
    bucketId: uuid("bucket_id")
      .notNull()
      .references(() => buckets.id),
    bucketName: varchar("bucket_name", { length: 128 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.origin, table.target, table.bucketId] }),
  ]
);

export type UserInvitation = InferSelectModel<typeof userInvitations>;

// Bucket maintainer invitations table
export const bucketMaintainerInvitations = pgTable(
  "bucket_maintainer_invitations",
  {
    origin: uuid("origin")
      .notNull()
      .references(() => user.id),
    target: uuid("target")
      .notNull()
      .references(() => user.id),
    bucketId: uuid("bucket_id")
      .notNull()
      .references(() => buckets.id),
    bucketName: varchar("bucket_name", { length: 128 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.origin, table.target, table.bucketId] }),
  ]
);

export type BucketMaintainerInvitation = InferSelectModel<
  typeof bucketMaintainerInvitations
>;

// Course maintainer invitations table
export const courseMaintainerInvitations = pgTable(
  "course_maintainer_invitations",
  {
    origin: uuid("origin")
      .notNull()
      .references(() => user.id),
    target: uuid("target")
      .notNull()
      .references(() => user.id),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id),
    courseName: varchar("course_name", { length: 128 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.origin, table.target, table.courseId] }),
  ]
);

export type CourseMaintainerInvitation = InferSelectModel<
  typeof courseMaintainerInvitations
>;

// Tasks table
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  fileSize: bigint("file_size", { mode: "number" }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  status: taskStatusEnum("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  pubDate: timestamp("pub_date"),
});

export type Task = InferSelectModel<typeof tasks>;

// Prompts table
export const prompts = pgTable("prompts", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 128 }).notNull(),
  content: text("content").notNull(),
});

export type Prompt = InferSelectModel<typeof prompts>;

// Models table
export const models = pgTable("models", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  bucketId: uuid("bucket_id")
    .notNull()
    .references(() => buckets.id),
  name: varchar("name", { length: 128 }).notNull(),
  encApiKey: varchar("enc_api_key", { length: 512 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resourceName: varchar("resource_name", { length: 128 }),
  deploymentId: varchar("deployment_id", { length: 128 }),
  description: varchar("description", { length: 128 }),
});

export type Model = InferSelectModel<typeof models>;
