-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable other useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Main schema creation
CREATE TYPE "public"."bucket_type" AS ENUM('small', 'medium', 'large', 'org');--> statement-breakpoint
CREATE TYPE "public"."document_kind" AS ENUM('code', 'text');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('scheduled', 'processing', 'failed', 'finished');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'maintainer');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bucket_maintainer_invitations" (
	"origin" uuid NOT NULL,
	"target" uuid NOT NULL,
	"bucket_id" uuid NOT NULL,
	"bucket_name" varchar(128) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bucket_maintainer_invitations_origin_target_bucket_id_pk" PRIMARY KEY("origin","target","bucket_id")
);
--> statement-breakpoint
CREATE TABLE "bucket_users" (
	"bucket_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	CONSTRAINT "bucket_users_bucket_id_user_id_pk" PRIMARY KEY("bucket_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "buckets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"size" bigint DEFAULT 0 NOT NULL,
	"max_size" bigint NOT NULL,
	"type" "bucket_type" NOT NULL,
	"subscription_id" varchar(128) DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(128) NOT NULL,
	"is_favourite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_keys" (
	"course_id" uuid NOT NULL,
	"key" varchar(256) NOT NULL,
	CONSTRAINT "course_keys_course_id_pk" PRIMARY KEY("course_id")
);
--> statement-breakpoint
CREATE TABLE "course_maintainer_invitations" (
	"origin" uuid NOT NULL,
	"target" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"course_name" varchar(128) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_maintainer_invitations_origin_target_course_id_pk" PRIMARY KEY("origin","target","course_id")
);
--> statement-breakpoint
CREATE TABLE "course_users" (
	"course_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	CONSTRAINT "course_users_course_id_user_id_pk" PRIMARY KEY("course_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"bucket_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"private" boolean DEFAULT false NOT NULL,
	CONSTRAINT "courses_bucket_id_name_unique" UNIQUE("bucket_id","name")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(128) NOT NULL,
	"content" text NOT NULL,
	"kind" "document_kind" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "documents_id_created_at_pk" PRIMARY KEY("id","created_at"),
	CONSTRAINT "documents_user_id_title_unique" UNIQUE("user_id","title")
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"user_id" uuid NOT NULL,
	"subject" varchar(128) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_user_id_created_at_pk" PRIMARY KEY("user_id","created_at")
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"size" integer NOT NULL,
	"page_count" smallint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "files_course_id_name_unique" UNIQUE("course_id","name")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"role" "role" NOT NULL,
	"parts" json NOT NULL,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bucket_id" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"enc_api_key" varchar(512) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resource_name" varchar(128),
	"deployment_id" varchar(128),
	"description" varchar(128)
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"file_name" varchar(128) NOT NULL,
	"course_id" uuid NOT NULL,
	"course_name" varchar(128) NOT NULL,
	"embedding" vector(768) NOT NULL,
	"content" text NOT NULL,
	"page_index" smallint NOT NULL,
	"page_number" smallint,
	"fts" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', "pages"."content")) STORED NOT NULL,
	CONSTRAINT "pages_id_course_id_pk" PRIMARY KEY("id","course_id")
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"content" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sso_provider" (
	"id" text PRIMARY KEY NOT NULL,
	"issuer" text NOT NULL,
	"oidc_config" text,
	"saml_config" text,
	"user_id" text,
	"provider_id" text NOT NULL,
	"organization_id" text,
	"domain" text NOT NULL,
	CONSTRAINT "sso_provider_provider_id_unique" UNIQUE("provider_id")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"file_size" bigint NOT NULL,
	"name" varchar(128) NOT NULL,
	"status" "task_status" DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"pub_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"last_login_method" text,
	"is_public" boolean DEFAULT true NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username"),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_invitations" (
	"origin" uuid NOT NULL,
	"target" uuid NOT NULL,
	"bucket_id" uuid NOT NULL,
	"bucket_name" varchar(128) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_invitations_origin_target_bucket_id_pk" PRIMARY KEY("origin","target","bucket_id")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bucket_maintainer_invitations" ADD CONSTRAINT "bucket_maintainer_invitations_origin_user_id_fk" FOREIGN KEY ("origin") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bucket_maintainer_invitations" ADD CONSTRAINT "bucket_maintainer_invitations_target_user_id_fk" FOREIGN KEY ("target") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bucket_maintainer_invitations" ADD CONSTRAINT "bucket_maintainer_invitations_bucket_id_buckets_id_fk" FOREIGN KEY ("bucket_id") REFERENCES "public"."buckets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bucket_users" ADD CONSTRAINT "bucket_users_bucket_id_buckets_id_fk" FOREIGN KEY ("bucket_id") REFERENCES "public"."buckets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bucket_users" ADD CONSTRAINT "bucket_users_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buckets" ADD CONSTRAINT "buckets_owner_user_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_maintainer_invitations" ADD CONSTRAINT "course_maintainer_invitations_origin_user_id_fk" FOREIGN KEY ("origin") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_maintainer_invitations" ADD CONSTRAINT "course_maintainer_invitations_target_user_id_fk" FOREIGN KEY ("target") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_maintainer_invitations" ADD CONSTRAINT "course_maintainer_invitations_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_users" ADD CONSTRAINT "course_users_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_users" ADD CONSTRAINT "course_users_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_bucket_id_buckets_id_fk" FOREIGN KEY ("bucket_id") REFERENCES "public"."buckets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_bucket_id_buckets_id_fk" FOREIGN KEY ("bucket_id") REFERENCES "public"."buckets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sso_provider" ADD CONSTRAINT "sso_provider_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_origin_user_id_fk" FOREIGN KEY ("origin") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_target_user_id_fk" FOREIGN KEY ("target") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_bucket_id_buckets_id_fk" FOREIGN KEY ("bucket_id") REFERENCES "public"."buckets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bucket_users_bucket_id" ON "bucket_users" USING btree ("bucket_id");--> statement-breakpoint
CREATE INDEX "idx_bucket_users_user_id" ON "bucket_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_bucket_users_user_id_role" ON "bucket_users" USING btree ("user_id","role");--> statement-breakpoint
CREATE INDEX "idx_bucket_users_bucket_id_role" ON "bucket_users" USING btree ("bucket_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "buckets_owner_name_unique" ON "buckets" USING btree ("owner","name");--> statement-breakpoint
CREATE INDEX "idx_course_users_course_id" ON "course_users" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_course_users_user_id" ON "course_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_course_users_user_id_role" ON "course_users" USING btree ("user_id","role");--> statement-breakpoint
CREATE INDEX "idx_course_users_course_id_role" ON "course_users" USING btree ("course_id","role");--> statement-breakpoint
CREATE INDEX "idx_content_search" ON "pages" USING gin ("fts");