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

export const user = pgTable("user", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  name: text("name").notNull(),
  // generate a short unique username like "user_a1b2c3d4" when not provided
  username: text("username")
    .notNull()
    .default(
      // take first 8 chars of uuid (without dashes) to keep username short and unique
      sql`'user_' || substring(replace(uuid_generate_v4()::text, '-', '') from 1 for 8)`
    )
    .unique(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  lastLoginMethod: text("last_login_method"),
  isPublic: boolean("is_public").default(true).notNull(),
});

export type User = InferSelectModel<typeof user>;

export const account = pgTable("account", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: uuid("user_id")
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
  id: uuid("id")
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const ssoProvider = pgTable("sso_provider", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  issuer: text("issuer").notNull(),
  oidcConfig: text("oidc_config"),
  samlConfig: text("saml_config"),
  userId: uuid("user_id").references(() => user.id, { onDelete: "cascade" }),
  providerId: text("provider_id").notNull().unique(),
  organizationId: uuid("organization_id"),
  domain: text("domain").notNull(),
});

// Enums
export const bucketTypeEnum = pgEnum("bucket_type", [
  "small",
  "medium",
  "large",
  "org",
]);
export type BucketType = "small" | "medium" | "large" | "org";

export const roleEnum = pgEnum("role", ["user", "assistant", "system"]);
export type Role = "user" | "assistant" | "system";

export const userRoleEnum = pgEnum("user_role", ["user", "maintainer"]);
export type UserRole = "user" | "maintainer";

export const documentKindEnum = pgEnum("document_kind", ["code", "text"]);
export type DocumentKind = "code" | "text";

export const taskStatusEnum = pgEnum("task_status", [
  "scheduled",
  "processing",
  "failed",
  "finished",
]);
export type TaskStatus = "scheduled" | "processing" | "failed" | "finished";

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
    public: boolean("public").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("buckets_owner_name_unique").on(table.owner, table.name),
    index("idx_buckets_public").on(table.public),
  ]
);

export type Bucket = InferSelectModel<typeof buckets>;

// Bucket users table
export const bucketUserRoles = pgTable(
  "bucket_users",
  {
    bucketId: uuid("bucket_id")
      .notNull()
      .references(() => buckets.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull().default("user"),
  },
  (table) => [
    primaryKey({ columns: [table.bucketId, table.userId] }),
    // index for queries by bucketId
    index("idx_bucket_users_bucket_id").on(table.bucketId),
    // index for queries by userId
    index("idx_bucket_users_user_id").on(table.userId),
    // composite index for queries by (userId, role)
    index("idx_bucket_users_user_id_role").on(table.userId, table.role),
    // composite index for queries by (bucketId, role)
    index("idx_bucket_users_bucket_id_role").on(table.bucketId, table.role),
  ]
);

export type BucketUserRole = InferSelectModel<typeof bucketUserRoles>;

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
export const courseUserRoles = pgTable(
  "course_users",
  {
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull().default("user"),
  },
  (table) => [
    primaryKey({ columns: [table.courseId, table.userId] }),
    // index for queries by courseId
    index("idx_course_users_course_id").on(table.courseId),
    // index for queries by userId
    index("idx_course_users_user_id").on(table.userId),
    // composite index for queries by (userId, role)
    index("idx_course_users_user_id_role").on(table.userId, table.role),
    // composite index for queries by (courseId, role)
    index("idx_course_users_course_id_role").on(table.courseId, table.role),
  ]
);

export type CourseUserRole = InferSelectModel<typeof courseUserRoles>;

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

export const toolCallDocuments = pgTable("tool_call_documents", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 128 }).notNull(),
  content: text("content").notNull(),
  kind: documentKindEnum("kind").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ToolCallDocument = InferSelectModel<typeof toolCallDocuments>;

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

export type CustomDocument = InferSelectModel<typeof documents>;

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
    pageCount: smallint("page_count"),
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

export const chunks = pgTable(
  "chunks",
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
    pageIndex: integer("page_index").notNull(),
    pageNumber: smallint("page_number"),
    content: text("content").notNull(),
    bbox: json("bbox").$type<[number, number, number, number]>(),
    fts: tsvector("fts")
      .notNull()
      .generatedAlwaysAs(
        (): SQL => sql`to_tsvector('english', ${chunks.content})`
      ),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.courseId] }),
    index("idx_content_search").using("gin", table.fts),
  ]
);

export type Chunk = InferSelectModel<typeof chunks>;

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
  errorMessage: text("error_message").notNull().default(""),
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
