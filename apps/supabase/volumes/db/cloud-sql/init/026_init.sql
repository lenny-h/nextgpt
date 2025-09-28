-- Create custom types

CREATE TYPE "public"."bucket_type" AS ENUM (
    'small',
    'medium',
    'large',
    'org'
);

ALTER TYPE "public"."bucket_type" OWNER TO "postgres";

CREATE TYPE "public"."role" AS ENUM (
    'user',
    'assistant',
    'system'
);

ALTER TYPE "public"."role" OWNER TO "postgres";

CREATE TYPE "public"."document_kind" AS ENUM (
    'code',
    'text'
);

ALTER TYPE "public"."document_kind" OWNER TO "postgres";

CREATE TYPE "public"."task_status" AS ENUM (
    'scheduled',
    'processing',
    'failed',
    'finished'
);

ALTER TYPE "public"."task_status" OWNER TO "postgres";

-- Database setup

SET default_tablespace = '';

SET default_table_access_method = "heap";

-- Public schema setup


-- Buckets table

CREATE TABLE IF NOT EXISTS "public"."buckets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner" "uuid" NOT NULL,
    "name" character varying(128) NOT NULL,
    "size" bigint DEFAULT 0 NOT NULL,
    "max_size" bigint NOT NULL,
    "type" "public"."bucket_type" NOT NULL,
    "users_count" smallint DEFAULT 0 NOT NULL,
    "subscription_id" character varying(128) DEFAULT ''::character varying NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."buckets" OWNER TO "postgres";

ALTER TABLE ONLY "public"."buckets"
    ADD CONSTRAINT "buckets_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."buckets"
    ADD CONSTRAINT "buckets_owner_name_unique" UNIQUE ("owner", "name");


-- Bucket maintainers table

CREATE TABLE IF NOT EXISTS "public"."bucket_maintainers" (
    "bucket_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL
);

ALTER TABLE "public"."bucket_maintainers" OWNER TO "postgres";

ALTER TABLE ONLY "public"."bucket_maintainers"
    ADD CONSTRAINT "bucket_maintainers_bucket_id_user_id_pk" PRIMARY KEY ("bucket_id", "user_id");


-- Bucket users table

CREATE TABLE IF NOT EXISTS "public"."bucket_users" (
    "bucket_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL
);

ALTER TABLE "public"."bucket_users" OWNER TO "postgres";

ALTER TABLE ONLY "public"."bucket_users"
    ADD CONSTRAINT "bucket_users_bucket_id_user_id_pk" PRIMARY KEY ("bucket_id", "user_id");


-- Chats table

CREATE TABLE IF NOT EXISTS "public"."chats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" character varying(128) NOT NULL,
    "is_favourite" boolean DEFAULT false NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."chats" OWNER TO "postgres";

ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_pkey" PRIMARY KEY ("id");


-- Messages table

CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chat_id" "uuid" NOT NULL,
    "role" "public"."role" NOT NULL,
    "parts" "json" NOT NULL,
    "metadata" "json",
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."messages" OWNER TO "postgres";

ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");


-- Courses table

CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(128) NOT NULL,
    "description" "text",
    "bucket_id" "uuid" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "private" boolean DEFAULT false NOT NULL
);

ALTER TABLE "public"."courses" OWNER TO "postgres";

ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_bucket_id_name_unique" UNIQUE ("bucket_id", "name");


-- Course users table

CREATE TABLE IF NOT EXISTS "public"."course_users" (
    "course_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL
);

ALTER TABLE "public"."course_users" OWNER TO "postgres";

ALTER TABLE ONLY "public"."course_users"
    ADD CONSTRAINT "course_users_course_id_user_id_pk" PRIMARY KEY ("course_id", "user_id");


-- Course keys table

CREATE TABLE IF NOT EXISTS "public"."course_keys" (
    "course_id" "uuid" NOT NULL,
    "key" character varying(256) NOT NULL
);

ALTER TABLE "public"."course_keys" OWNER TO "postgres";

ALTER TABLE ONLY "public"."course_keys"
    ADD CONSTRAINT "course_keys_pkey" PRIMARY KEY ("course_id");


-- Course maintainers table

CREATE TABLE IF NOT EXISTS "public"."course_maintainers" (
    "course_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL
);

ALTER TABLE "public"."course_maintainers" OWNER TO "postgres";

ALTER TABLE ONLY "public"."course_maintainers"
    ADD CONSTRAINT "course_maintainers_course_id_user_id_pk" PRIMARY KEY ("course_id", "user_id");


-- Documents table

CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" character varying(128) NOT NULL,
    "content" "text" NOT NULL,
    "kind" "public"."document_kind" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."documents" OWNER TO "postgres";

ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_id_created_at_pk" PRIMARY KEY ("id", "created_at");

ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_user_id_title_unique" UNIQUE ("user_id", "title");


-- Feedback table

CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "user_id" "uuid" NOT NULL,
    "subject" character varying(128) NOT NULL,
    "content" "text" NOT NULL,
    "created_at" "date" DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."feedback" OWNER TO "postgres";

ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_user_id_created_at_pk" PRIMARY KEY ("user_id", "created_at");


-- Files table

CREATE TABLE IF NOT EXISTS "public"."files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid" NOT NULL,
    "name" character varying(128) NOT NULL,
    "size" integer NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."files" OWNER TO "postgres";

ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_course_id_name_unique" UNIQUE ("course_id", "name");


-- Pages table

CREATE TABLE IF NOT EXISTS "public"."pages" (
    "id" "uuid" NOT NULL,
    "file_id" "uuid" NOT NULL,
    "file_name" character varying(128) NOT NULL,
    "course_id" "uuid" NOT NULL,
    "course_name" character varying(128) NOT NULL,
    "embedding" "extensions"."vector"(768) NOT NULL,
    "content" "text" NOT NULL,
    "page_index" smallint NOT NULL,
    "page_number" smallint,
    "chapter" smallint,
    "sub_chapter" smallint,
    "fts" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"english"'::"regconfig", "content")) STORED
);

ALTER TABLE "public"."pages" OWNER TO "postgres";

ALTER TABLE ONLY "public"."pages"
    ADD CONSTRAINT "pages_id_course_id_pk" PRIMARY KEY ("id", "course_id");


-- User invitations table

CREATE TABLE IF NOT EXISTS "public"."user_invitations" (
    "origin" "uuid" NOT NULL,
    "target" "uuid" NOT NULL,
    "bucket_id" "uuid" NOT NULL,
    "bucket_name" character varying(128) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."user_invitations" OWNER TO "postgres";

ALTER TABLE ONLY "public"."user_invitations"
    ADD CONSTRAINT "user_invitations_origin_target_bucket_id_pk" PRIMARY KEY ("origin", "target", "bucket_id");


-- Bucket maintainer invitations table

CREATE TABLE IF NOT EXISTS "public"."bucket_maintainer_invitations" (
    "origin" "uuid" NOT NULL,
    "target" "uuid" NOT NULL,
    "bucket_id" "uuid" NOT NULL,
    "bucket_name" character varying(128) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."bucket_maintainer_invitations" OWNER TO "postgres";

ALTER TABLE ONLY "public"."bucket_maintainer_invitations"
    ADD CONSTRAINT "bucket_maintainer_invitations_origin_target_bucket_id_pk" PRIMARY KEY ("origin", "target", "bucket_id");


-- Course maintainer invitations table

CREATE TABLE IF NOT EXISTS "public"."course_maintainer_invitations" (
    "origin" "uuid" NOT NULL,
    "target" "uuid" NOT NULL,
    "course_id" "uuid" NOT NULL,
    "course_name" character varying(128) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."course_maintainer_invitations" OWNER TO "postgres";

ALTER TABLE ONLY "public"."course_maintainer_invitations"
    ADD CONSTRAINT "course_maintainer_invitations_origin_target_course_id_pk" PRIMARY KEY ("origin", "target", "course_id");


-- Task table

CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid" NOT NULL,
    "file_size" bigint NOT NULL,
    "name" character varying(128) NOT NULL,
    "status" "public"."task_status" DEFAULT 'scheduled'::"public"."task_status" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "pub_date" timestamp without time zone
);

ALTER TABLE "public"."tasks" OWNER TO "postgres";

ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");


-- Profiles table

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "name" character varying(128) NOT NULL,
    "username" character varying(128) NOT NULL,
    "public" boolean DEFAULT false NOT NULL
);

ALTER TABLE "public"."profiles" OWNER TO "postgres";

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_unique" UNIQUE ("username");


-- Prompts table

CREATE TABLE IF NOT EXISTS "public"."prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(128) NOT NULL,
    "content" "text" NOT NULL
);

ALTER TABLE "public"."prompts" OWNER TO "postgres";

ALTER TABLE ONLY "public"."prompts"
    ADD CONSTRAINT "prompts_pkey" PRIMARY KEY ("id");


-- Models table

CREATE TABLE IF NOT EXISTS "public"."models" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket_id" "uuid" NOT NULL,
    "name" character varying(128) NOT NULL,
    "enc_api_key" character varying(512) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "resource_name" character varying(128),
    "deployment_id" character varying(128),
    "description" character varying(128)
);

ALTER TABLE "public"."models" OWNER TO "postgres";

ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_pkey" PRIMARY KEY ("id");


-- Indexes

CREATE INDEX "idx_bucket_maintainers_bucket_id" ON "public"."bucket_maintainers" USING "btree" ("bucket_id", "user_id");

CREATE INDEX "idx_bucket_users_bucket_id" ON "public"."bucket_users" USING "btree" ("bucket_id", "user_id");

CREATE INDEX "idx_course_maintainers_course_id_user_id" ON "public"."course_maintainers" USING "btree" ("course_id", "user_id");

CREATE INDEX "idx_course_users_course_id_user_id" ON "public"."course_users" USING "btree" ("course_id", "user_id");

CREATE INDEX "idx_files_course_id" ON "public"."files" USING "btree" ("course_id");

CREATE INDEX "idx_files_created_at" ON "public"."files" USING "btree" ("created_at");

CREATE INDEX "idx_pages_fts" ON "public"."pages" USING "gin" ("fts");


-- Foreign key constraints

ALTER TABLE ONLY "public"."buckets"
    ADD CONSTRAINT "buckets_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."bucket_maintainers"
    ADD CONSTRAINT "bucket_maintainers_bucket_id_buckets_id_fk" FOREIGN KEY ("bucket_id") REFERENCES "public"."buckets"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."bucket_maintainers"
    ADD CONSTRAINT "bucket_maintainers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."bucket_users"
    ADD CONSTRAINT "bucket_users_bucket_id_bucket_id_fk" FOREIGN KEY ("bucket_id") REFERENCES "public"."buckets"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."bucket_users"
    ADD CONSTRAINT "bucket_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_bucket_id_bucket_id_fk" FOREIGN KEY ("bucket_id") REFERENCES "public"."buckets"("id");

ALTER TABLE ONLY "public"."course_maintainers"
    ADD CONSTRAINT "course_maintainers_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."course_maintainers"
    ADD CONSTRAINT "course_maintainers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."course_users"
    ADD CONSTRAINT "course_users_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."course_users"
    ADD CONSTRAINT "course_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id");

ALTER TABLE ONLY "public"."pages"
    ADD CONSTRAINT "pages_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id");

ALTER TABLE ONLY "public"."pages"
    ADD CONSTRAINT "pages_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."user_invitations"
    ADD CONSTRAINT "user_invitations_bucket_id_bucket_id_fk" FOREIGN KEY ("bucket_id") REFERENCES "public"."buckets"("id");

ALTER TABLE ONLY "public"."user_invitations"
    ADD CONSTRAINT "user_invitations_origin_users_id_fk" FOREIGN KEY ("origin") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."user_invitations"
    ADD CONSTRAINT "user_invitations_target_users_id_fk" FOREIGN KEY ("target") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."bucket_maintainer_invitations"
    ADD CONSTRAINT "bucket_maintainer_invitations_bucket_id_bucket_id_fk" FOREIGN KEY ("bucket_id") REFERENCES "public"."buckets"("id");

ALTER TABLE ONLY "public"."bucket_maintainer_invitations"
    ADD CONSTRAINT "bucket_maintainer_invitations_origin_users_id_fk" FOREIGN KEY ("origin") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."bucket_maintainer_invitations"
    ADD CONSTRAINT "bucket_maintainer_invitations_target_users_id_fk" FOREIGN KEY ("target") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."course_maintainer_invitations"
    ADD CONSTRAINT "course_maintainer_invitations_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id");

ALTER TABLE ONLY "public"."course_maintainer_invitations"
    ADD CONSTRAINT "course_maintainer_invitations_origin_users_id_fk" FOREIGN KEY ("origin") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."course_maintainer_invitations"
    ADD CONSTRAINT "course_maintainer_invitations_target_users_id_fk" FOREIGN KEY ("target") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."prompts"
    ADD CONSTRAINT "prompts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_bucket_id_bucket_id_fk" FOREIGN KEY ("bucket_id") REFERENCES "public"."buckets"("id");


-- Create functions

-- accept_invitation function

CREATE OR REPLACE FUNCTION "public"."accept_invitation"("p_invitation_type" character varying, "p_origin_user_id" "uuid", "p_target_user_id" "uuid", "p_resource_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET search_path = 'public'
    AS $$
BEGIN
    IF p_invitation_type = 'user' THEN
        -- Insert the user into bucket_users if not exists
        INSERT INTO bucket_users(bucket_id, user_id)
        VALUES (p_resource_id, p_target_user_id)
        ON CONFLICT DO NOTHING;

        -- Increase the bucket user count
        UPDATE buckets
        SET users_count = users_count + 1
        WHERE id = p_resource_id;
        
        -- Delete the invitation
        DELETE FROM user_invitations
        WHERE origin = p_origin_user_id
        AND target = p_target_user_id
        AND bucket_id = p_resource_id;
    ELSIF p_invitation_type = 'course_maintainer' THEN
        -- Insert the user as a course maintainer if not exists
        INSERT INTO course_maintainers(course_id, user_id)
        VALUES (p_resource_id, p_target_user_id)
        ON CONFLICT DO NOTHING;
        
        -- Delete the invitation
        DELETE FROM course_maintainer_invitations
        WHERE origin = p_origin_user_id
        AND target = p_target_user_id
        AND course_id = p_resource_id;
    ELSIF p_invitation_type = 'bucket_maintainer' THEN
        -- Insert the user as a bucket maintainer if not exists
        INSERT INTO bucket_maintainers(bucket_id, user_id)
        VALUES (p_resource_id, p_target_user_id)
        ON CONFLICT DO NOTHING;
        
        -- Delete the invitation
        DELETE FROM bucket_maintainer_invitations
        WHERE origin = p_origin_user_id
        AND target = p_target_user_id
        AND bucket_id = p_resource_id;
    END IF;
END;
$$;

ALTER FUNCTION "public"."accept_invitation"("p_invitation_type" character varying, "p_origin_user_id" "uuid", "p_target_user_id" "uuid", "p_resource_id" "uuid") OWNER TO "postgres";


-- add_task_and_update_bucket

CREATE OR REPLACE FUNCTION "public"."add_task_and_update_bucket"("p_id" "uuid", "p_course_id" "uuid", "p_name" character varying, "p_file_size" bigint, "p_pub_date" timestamp without time zone DEFAULT NULL::timestamp without time zone) RETURNS "void"
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
DECLARE
  v_bucket_id UUID;
BEGIN
  -- Get the bucket ID for the course
  SELECT bucket_id INTO v_bucket_id FROM courses WHERE id = p_course_id;
  
  IF v_bucket_id IS NULL THEN
    RAISE EXCEPTION 'Course not found';
  END IF;

  -- Insert the task
  INSERT INTO tasks (id, course_id, file_size, name, pub_date)
  VALUES (p_id, p_course_id, p_file_size, p_name, p_pub_date);

  -- Update the bucket size
  UPDATE buckets
  SET size = size + p_file_size
  WHERE id = v_bucket_id;
END;
$$;

ALTER FUNCTION "public"."add_task_and_update_bucket"("p_id" "uuid", "p_course_id" "uuid", "p_name" character varying, "p_file_size" bigint, "p_pub_date" timestamp without time zone) OWNER TO "postgres";


-- create_bucket

CREATE OR REPLACE FUNCTION "public"."create_bucket"("p_owner" "uuid", "p_name" character varying, "p_type" "public"."bucket_type", "p_max_size" bigint) RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
DECLARE
  v_bucket_id UUID;
BEGIN
  -- Insert bucket
  INSERT INTO buckets (owner, name, type, users_count, max_size)
  VALUES (p_owner, p_name, p_type, 1, p_max_size)
  RETURNING id INTO v_bucket_id;

  -- Insert bucket maintainer
  INSERT INTO bucket_maintainers (bucket_id, user_id)
  VALUES (v_bucket_id, p_owner);
  
  -- Insert bucket user
  INSERT INTO bucket_users (bucket_id, user_id)
  VALUES (v_bucket_id, p_owner);
  
  RETURN v_bucket_id;
END;
$$;

ALTER FUNCTION "public"."create_bucket"("p_owner" "uuid", "p_name" character varying, "p_type" "public"."bucket_type", "p_max_size" bigint) OWNER TO "postgres";


-- create_course

CREATE OR REPLACE FUNCTION "public"."create_course"("p_name" character varying, "p_description" "text", "p_bucket_id" "uuid", "p_user_id" "uuid", "p_encrypted_key" character varying DEFAULT NULL) RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
DECLARE
  v_course_id UUID;
BEGIN
  -- Insert course
  INSERT INTO courses (name, description, bucket_id, private)
  VALUES (p_name, p_description, p_bucket_id, p_encrypted_key IS NOT NULL)
  RETURNING id INTO v_course_id;
  
  -- Insert maintainer
  INSERT INTO course_maintainers (course_id, user_id)
  VALUES (v_course_id, p_user_id);
  
  -- Insert encrypted key if provided
  IF p_encrypted_key IS NOT NULL THEN
    INSERT INTO course_keys (course_id, key)
    VALUES (v_course_id, p_encrypted_key);
  END IF;
  
  RETURN v_course_id;
END;
$$;

ALTER FUNCTION "public"."create_course"("p_name" character varying, "p_description" "text", "p_bucket_id" "uuid", "p_user_id" "uuid", "p_encrypted_key" character varying) OWNER TO "postgres";


-- create_profile

CREATE OR REPLACE FUNCTION "public"."create_profile"("p_name" character varying, "p_username" character varying, "p_public" boolean DEFAULT false) RETURNS "void"
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO profiles (id, name, username, public)
    VALUES ((select auth.uid()), p_name, p_username, p_public);
END;
$$;

ALTER FUNCTION "public"."create_profile"("p_name" character varying, "p_username" character varying, "p_public" boolean) OWNER TO "postgres";


-- delete_chat

CREATE OR REPLACE FUNCTION "public"."delete_chat"("p_chat_id" "uuid") RETURNS "void"
    LANGUAGE "sql"
    SET search_path = 'public'
AS $$
    delete
    from chats
    where id = p_chat_id
    and (user_id = (select auth.uid()));
$$;

ALTER FUNCTION "public"."delete_chat"("p_chat_id" "uuid") OWNER TO "postgres";


-- delete_correction_prompt

CREATE OR REPLACE FUNCTION "public"."delete_correction_prompt"("p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
BEGIN
    DELETE FROM prompts
    WHERE id = p_id
    AND user_id = (select auth.uid());
END;
$$;

ALTER FUNCTION "public"."delete_correction_prompt"("p_id" "uuid") OWNER TO "postgres";


-- delete_document

CREATE OR REPLACE FUNCTION "public"."delete_document"("p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
BEGIN
    DELETE FROM documents
    WHERE id = p_id AND user_id = (select auth.uid());
END;
$$;

ALTER FUNCTION "public"."delete_document"("p_id" "uuid") OWNER TO "postgres";


-- delete_file_and_update_bucket_size

CREATE OR REPLACE FUNCTION "public"."delete_file_and_update_bucket_size"("p_file_id" "uuid", "p_bucket_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
DECLARE
  v_deleted_file_size BIGINT;
BEGIN
  -- Attempt to delete the file and retrieve its size
  DELETE FROM files
  WHERE id = p_file_id
  RETURNING size INTO v_deleted_file_size;

  -- If no file was deleted (file not found), raise an error
  IF NOT FOUND THEN
    RAISE EXCEPTION 'File not found with ID %', p_file_id;
  END IF;

  -- Update the bucket's size by subtracting the deleted file's size
  UPDATE buckets
  SET size = buckets.size - v_deleted_file_size
  WHERE id = p_bucket_id;

  -- If no bucket was updated (bucket not found), raise an error
  -- This ensures the transaction rolls back if the bucket doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bucket not found with ID %', p_bucket_id;
  END IF;
END;
$$;

ALTER FUNCTION "public"."delete_file_and_update_bucket_size"("p_file_id" "uuid", "p_bucket_id" "uuid") OWNER TO "postgres";


-- delete_invitation

CREATE OR REPLACE FUNCTION "public"."delete_invitation"("p_invitation_type" character varying, "p_origin" "uuid", "p_target" "uuid", "p_resource_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
BEGIN
    IF p_invitation_type = 'user' THEN
        DELETE FROM user_invitations
        WHERE origin = p_origin
        AND target = p_target
        AND bucket_id = p_resource_id;
    ELSIF p_invitation_type = 'course_maintainer' THEN
        DELETE FROM course_maintainer_invitations
        WHERE origin = p_origin
        AND target = p_target
        AND course_id = p_resource_id;
    ELSIF p_invitation_type = 'bucket_maintainer' THEN
        DELETE FROM bucket_maintainer_invitations
        WHERE origin = p_origin
        AND target = p_target
        AND bucket_id = p_resource_id;
    END IF;
END;
$$;

ALTER FUNCTION "public"."delete_invitation"("p_invitation_type" character varying, "p_origin" "uuid", "p_target" "uuid", "p_resource_id" "uuid") OWNER TO "postgres";


-- get_bucket_courses

CREATE OR REPLACE FUNCTION "public"."get_bucket_courses"("p_bucket_id" "uuid", "page_number" integer DEFAULT 0, "items_per_page" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "name" character varying, "private" boolean)
    LANGUAGE "sql" STABLE
    SET search_path = 'public'
AS $$
    SELECT id, name, private
    FROM courses
    WHERE bucket_id = p_bucket_id
    ORDER BY created_at DESC
    LIMIT items_per_page
    OFFSET (page_number * items_per_page);
$$;

ALTER FUNCTION "public"."get_bucket_courses"("p_bucket_id" "uuid", "page_number" integer, "items_per_page" integer) OWNER TO "postgres";


-- get_bucket_maintainers

CREATE OR REPLACE FUNCTION "public"."get_bucket_maintainers"("p_bucket_id" "uuid") RETURNS TABLE("id" "uuid", "username" character varying)
    LANGUAGE "plpgsql"
    SECURITY DEFINER
    SET search_path = 'public'
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM bucket_maintainers bm
        WHERE bm.bucket_id = p_bucket_id AND bm.user_id = (select auth.uid())
    ) THEN
        RETURN;  -- Return empty if the user is not a maintainer
    END IF;

    RETURN QUERY
    SELECT bm.user_id, p.username
    FROM bucket_maintainers bm
    JOIN profiles p ON bm.user_id = p.id
    WHERE bm.bucket_id = p_bucket_id;
END;
$$;

ALTER FUNCTION "public"."get_bucket_maintainers"("p_bucket_id" "uuid") OWNER TO "postgres";


-- get_bucket_models

CREATE OR REPLACE FUNCTION "public"."get_bucket_models"() RETURNS TABLE("id" "uuid", "bucket_id" "uuid", "bucket_name" character varying, "name" character varying, "created_at" timestamp without time zone)
    LANGUAGE "sql" STABLE
    SET search_path = 'public'
AS $$
    select m.id, m.bucket_id, b.name as bucket_name, m.name, m.created_at
    from models m
    join buckets b on m.bucket_id = b.id
    where b.owner = (select auth.uid())
    order by m.created_at desc;
$$;

ALTER FUNCTION "public"."get_bucket_models"() OWNER TO "postgres";


-- get_bucket_users

CREATE OR REPLACE FUNCTION "public"."get_bucket_users"("p_bucket_id" "uuid") RETURNS TABLE("id" "uuid", "username" character varying)
    LANGUAGE "plpgsql"
    SECURITY DEFINER
    SET search_path = 'public'
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM bucket_maintainers bm
        WHERE bm.bucket_id = p_bucket_id AND bm.user_id = (select auth.uid())
    ) THEN
        RETURN;  -- Return empty if the user is not a maintainer of the bucket
    END IF;

    RETURN QUERY
    SELECT bu.user_id, p.username
    FROM bucket_users bu
    JOIN profiles p ON bu.user_id = p.id
    WHERE bu.bucket_id = p_bucket_id
    LIMIT 5;
END;
$$;

ALTER FUNCTION "public"."get_bucket_users"("p_bucket_id" "uuid") OWNER TO "postgres";


-- get_course_files

CREATE OR REPLACE FUNCTION "public"."get_course_files"("p_course_id" "uuid", "page_number" integer DEFAULT 0, "items_per_page" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "course_id" "uuid", "name" character varying, "size" integer, "created_at" timestamp without time zone)
    LANGUAGE "sql" STABLE
    SET search_path = 'public'
AS $$
    SELECT f.id, f.course_id, f.name, f.size, f.created_at
    FROM files f
    WHERE f.course_id = p_course_id 
    ORDER BY f.created_at DESC
    LIMIT items_per_page
    OFFSET (page_number * items_per_page);
$$;

ALTER FUNCTION "public"."get_course_files"("p_course_id" "uuid", "page_number" integer, "items_per_page" integer) OWNER TO "postgres";


-- get_course_maintainers

CREATE OR REPLACE FUNCTION "public"."get_course_maintainers"("p_course_id" "uuid") RETURNS TABLE("id" "uuid", "username" character varying)
    LANGUAGE "plpgsql"
    SECURITY DEFINER
    SET search_path = 'public'
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM course_maintainers cm
        WHERE cm.course_id = p_course_id AND cm.user_id = (select auth.uid())
    ) THEN
        RETURN;  -- Return empty if the user is not a maintainer
    END IF;

    RETURN QUERY
    SELECT cm.user_id, p.username
    FROM course_maintainers cm
    JOIN profiles p ON cm.user_id = p.id
    WHERE cm.course_id = p_course_id;
END;
$$;

ALTER FUNCTION "public"."get_course_maintainers"("p_course_id" "uuid") OWNER TO "postgres";


-- get_course_tasks

CREATE OR REPLACE FUNCTION "public"."get_course_tasks"("p_course_id" "uuid", "page_number" integer DEFAULT 0, "items_per_page" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "course_id" "uuid", "name" character varying, "status" "public"."task_status", "created_at" timestamp without time zone, "pub_date" timestamp without time zone)
    LANGUAGE "sql" STABLE
    SET search_path = 'public'
AS $$
    SELECT t.id, t.course_id, t.name, t.status, t.created_at, t.pub_date
    FROM tasks t
    WHERE t.course_id = p_course_id 
    AND EXISTS (
        SELECT 1 
        FROM course_maintainers cm 
        WHERE cm.course_id = p_course_id
        AND cm.user_id = auth.uid()
    )
    ORDER BY t.created_at DESC
    LIMIT items_per_page
    OFFSET (page_number * items_per_page);
$$;

ALTER FUNCTION "public"."get_course_tasks"("p_course_id" "uuid", "page_number" integer, "items_per_page" integer) OWNER TO "postgres";


-- get_courses_files

CREATE OR REPLACE FUNCTION "public"."get_courses_files"("p_course_ids" "uuid"[], "page_number" integer DEFAULT 0, "items_per_page" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "course_id" "uuid", "name" character varying, "size" integer, "created_at" timestamp without time zone)
    LANGUAGE "sql" STABLE
    SET search_path = 'public'
AS $$
    SELECT f.id, f.course_id, f.name, f.size, f.created_at
    FROM files f
    WHERE f.course_id = ANY(p_course_ids)
    ORDER BY f.created_at DESC
    LIMIT items_per_page
    OFFSET (page_number * items_per_page);
$$;

ALTER FUNCTION "public"."get_courses_files"("p_course_ids" "uuid"[], "page_number" integer, "items_per_page" integer) OWNER TO "postgres";


-- get_favourite_user_chats

CREATE OR REPLACE FUNCTION "public"."get_favourite_user_chats"("page_number" integer DEFAULT 0, "items_per_page" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "user_id" "uuid", "title" character varying, "is_favourite" boolean, "created_at" timestamp without time zone)
    LANGUAGE "sql" STABLE
    SET search_path = 'public'
AS $$
    SELECT *
    FROM chats
    WHERE user_id = (SELECT auth.uid())
    AND (is_favourite = true)
    ORDER BY created_at DESC
    LIMIT items_per_page
    OFFSET (page_number * items_per_page);
$$;

ALTER FUNCTION "public"."get_favourite_user_chats"("page_number" integer, "items_per_page" integer) OWNER TO "postgres";


-- get_incoming_invitations

CREATE OR REPLACE FUNCTION "public"."get_incoming_invitations"("invitation_type" character varying, "page_number" integer default 0, "items_per_page" integer default 10) returns table("origin" "uuid", "origin_username" character varying, "target" "uuid", "resource_id" "uuid", "created_at" timestamp without time zone, "resource_name" character varying)
    LANGUAGE "plpgsql" STABLE
    SET search_path = 'public'
AS $$
BEGIN
    IF invitation_type = 'user' THEN
        RETURN query
        SELECT 
            ui.origin,
            p.username AS origin_username,
            ui.target,
            ui.bucket_id AS resource_id,
            ui.created_at,
            ui.bucket_name AS resource_name
        FROM user_invitations ui
        JOIN profiles p ON p.id = ui.origin
        WHERE ui.target = auth.uid()
        ORDER BY ui.created_at DESC
        LIMIT items_per_page
        OFFSET (page_number * items_per_page);
    ELSIF invitation_type = 'course_maintainer' THEN
        RETURN query
        SELECT 
            cmi.origin,
            p.username AS origin_username,
            cmi.target,
            cmi.course_id AS resource_id,
            cmi.created_at,
            cmi.course_name AS resource_name
        FROM course_maintainer_invitations cmi
        JOIN profiles p ON p.id = cmi.origin
        WHERE cmi.target = auth.uid()
        ORDER BY cmi.created_at DESC
        LIMIT items_per_page
        OFFSET (page_number * items_per_page);
    ELSIF invitation_type = 'bucket_maintainer' THEN
        RETURN query
        SELECT 
            bmi.origin,
            p.username AS origin_username,
            bmi.target,
            bmi.bucket_id AS resource_id,
            bmi.created_at,
            bmi.bucket_name AS resource_name
        FROM bucket_maintainer_invitations bmi
        JOIN profiles p ON p.id = bmi.origin
        WHERE bmi.target = auth.uid()
        ORDER BY bmi.created_at DESC
        LIMIT items_per_page
        OFFSET (page_number * items_per_page);
    END IF;
END;
$$;

ALTER FUNCTION "public"."get_incoming_invitations"("invitation_type" character varying, "page_number" integer, "items_per_page" integer) OWNER TO "postgres";


-- get_is_favourite

CREATE OR REPLACE FUNCTION "public"."get_is_favourite"("p_chat_id" "uuid") RETURNS TABLE("is_favourite" boolean)
    LANGUAGE "sql" STABLE
    SET search_path = 'public'
AS $$
    SELECT is_favourite
    FROM chats
    WHERE id = p_chat_id
    AND (user_id = (SELECT auth.uid()));
$$;

ALTER FUNCTION "public"."get_is_favourite"("p_chat_id" "uuid") OWNER TO "postgres";


-- get_maintained_buckets

CREATE OR REPLACE FUNCTION "public"."get_maintained_buckets"() RETURNS TABLE("id" "uuid", "owner" "uuid", "name" character varying, "size" bigint, "max_size" bigint, "type" "public"."bucket_type", "users_count" smallint, "subscription_id" character varying, "created_at" timestamp without time zone)
    LANGUAGE "sql" STABLE
    SET search_path = 'public'
AS $$
    SELECT *
    FROM buckets
    WHERE id IN (
        SELECT bucket_id
        FROM bucket_maintainers
        WHERE user_id = auth.uid()
    )
    ORDER BY created_at DESC;
$$;

ALTER FUNCTION "public"."get_maintained_buckets"() OWNER TO "postgres";


-- get_maintained_courses

CREATE OR REPLACE FUNCTION "public"."get_maintained_courses"("page_number" integer DEFAULT 0, "items_per_page" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "name" character varying, "description" "text", "bucket_id" "uuid", "bucket_name" character varying, "created_at" timestamp without time zone, private boolean)
    LANGUAGE "sql" STABLE
    SECURITY DEFINER
    SET search_path = 'public'
AS $$
    SELECT c.id, c.name, c.description, c.bucket_id, b.name, c.created_at, c.private
    FROM course_maintainers cm
    JOIN courses c ON cm.course_id = c.id
    JOIN buckets b ON c.bucket_id = b.id
    WHERE cm.user_id = (SELECT auth.uid())
    ORDER BY c.created_at DESC
    LIMIT items_per_page
    OFFSET (page_number * items_per_page);
$$;

ALTER FUNCTION "public"."get_maintained_courses"("page_number" integer, "items_per_page" integer) OWNER TO "postgres";


-- get_messages

CREATE OR REPLACE FUNCTION "public"."get_messages"("p_chat_id" "uuid") RETURNS TABLE ("id" "uuid", "role" "public"."role", "parts" json, "metadata" json)
    LANGUAGE "sql" STABLE
    SET search_path = 'public'
AS $$
    SELECT id, role, parts, metadata
    FROM messages
    WHERE chat_id = p_chat_id
    ORDER BY created_at ASC;
$$;

ALTER FUNCTION "public"."get_messages"("p_chat_id" "uuid") OWNER TO "postgres";


-- get_outgoing_invitations

CREATE OR REPLACE FUNCTION "public"."get_outgoing_invitations"("invitation_type" character varying, "page_number" integer default 0, "items_per_page" integer default 10) returns table("origin" "uuid", "target" "uuid", "target_username" character varying, "resource_id" "uuid", "created_at" timestamp without time zone, "resource_name" character varying)
    LANGUAGE "plpgsql" STABLE
    SET search_path = 'public'
AS $$
BEGIN
    IF invitation_type = 'user' THEN
        RETURN query
        SELECT 
            ui.origin,
            ui.target,
            p.username AS target_username,
            ui.bucket_id AS resource_id,
            ui.created_at,
            ui.bucket_name AS resource_name
        FROM user_invitations ui
        JOIN profiles p ON p.id = ui.target
        WHERE ui.origin = auth.uid()
        ORDER BY ui.created_at DESC
        LIMIT items_per_page
        OFFSET (page_number * items_per_page);
    ELSIF invitation_type = 'course_maintainer' THEN
        RETURN query
        SELECT 
            cmi.origin,
            cmi.target,
            p.username AS target_username,
            cmi.course_id AS resource_id,
            cmi.created_at,
            cmi.course_name AS resource_name
        FROM course_maintainer_invitations cmi
        JOIN profiles p ON p.id = cmi.target
        WHERE cmi.origin = auth.uid()
        ORDER BY cmi.created_at DESC
        LIMIT items_per_page
        OFFSET (page_number * items_per_page);
    ELSIF invitation_type = 'bucket_maintainer' THEN
        RETURN query
        SELECT 
            bmi.origin,
            bmi.target,
            p.username AS target_username,
            bmi.bucket_id AS resource_id,
            bmi.created_at,
            bmi.bucket_name AS resource_name
        FROM bucket_maintainer_invitations bmi
        JOIN profiles p ON p.id = bmi.target
        WHERE bmi.origin = auth.uid()
        ORDER BY bmi.created_at DESC
        LIMIT items_per_page
        OFFSET (page_number * items_per_page);
    END IF;
END;
$$;

ALTER FUNCTION "public"."get_outgoing_invitations"("invitation_type" character varying, "page_number" integer, "items_per_page" integer) OWNER TO "postgres";


-- get_random_chapter_pages

CREATE OR REPLACE FUNCTION "public"."get_random_chapter_pages"("p_file_id" "uuid", "p_file_chapters" smallint[], "retrieve_content" boolean DEFAULT false) RETURNS TABLE("id" "uuid", "file_id" "uuid", "file_name" character varying, "course_id" "uuid", "course_name" character varying, "page_index" smallint, "content" text)
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.file_id,
        p.file_name,
        p.course_id,
        p.course_name,
        p.page_index,
        CASE WHEN retrieve_content THEN p.content ELSE NULL END as content
    FROM pages p
    WHERE p.file_id = p_file_id AND p.chapter = ANY(p_file_chapters)
    ORDER BY random()
    LIMIT 4;
END;
$$;

ALTER FUNCTION "public"."get_random_chapter_pages"("p_file_id" "uuid", "p_file_chapters" smallint[], "retrieve_content" boolean) OWNER TO "postgres";


-- get_random_pages

CREATE OR REPLACE FUNCTION "public"."get_random_pages"("p_file_ids" "uuid"[], "retrieve_content" boolean DEFAULT false) RETURNS TABLE("id" "uuid", "file_id" "uuid", "file_name" character varying, "course_id" "uuid", "course_name" character varying, "page_index" smallint, "content" text)
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.file_id,
        p.file_name,
        p.course_id,
        p.course_name,
        p.page_index,
        CASE WHEN retrieve_content THEN p.content ELSE NULL END as content
    FROM pages p
    WHERE p.file_id = ANY(p_file_ids)
    ORDER BY random()
    LIMIT 4;
END;
$$;

ALTER FUNCTION "public"."get_random_pages"("p_file_ids" "uuid"[], "retrieve_content" boolean) OWNER TO "postgres";


-- get_user_buckets

CREATE OR REPLACE FUNCTION "public"."get_user_buckets"() RETURNS TABLE("bucket_id" "uuid", "name" character varying, "type" "public"."bucket_type")
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT bu.bucket_id, b.name, b.type
    FROM bucket_users bu
    JOIN buckets b ON bu.bucket_id = b.id
    WHERE bu.user_id = (SELECT auth.uid());
END;
$$;

ALTER FUNCTION "public"."get_user_buckets"() OWNER TO "postgres";


-- get_user_chats

CREATE OR REPLACE FUNCTION "public"."get_user_chats"("page_number" integer DEFAULT 0, "items_per_page" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "user_id" "uuid", "title" character varying, "is_favourite" boolean, "created_at" timestamp without time zone)
    LANGUAGE "sql" STABLE
    SET search_path = 'public'
AS $$
    SELECT c.id, c.user_id, c.title, c.is_favourite, c.created_at
    FROM chats c
    WHERE c.user_id = (SELECT auth.uid())
    ORDER BY created_at DESC
    LIMIT items_per_page
    OFFSET (page_number * items_per_page);
$$;

ALTER FUNCTION "public"."get_user_chats"("page_number" integer, "items_per_page" integer) OWNER TO "postgres";


-- get_user_document

CREATE OR REPLACE FUNCTION "public"."get_user_document"("p_id" "uuid") RETURNS TABLE("content" "text")
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        d.content
    FROM documents d
    WHERE d.id = p_id
    AND d.user_id = (SELECT auth.uid())
    LIMIT 1;
END;
$$;

ALTER FUNCTION "public"."get_user_document"("p_id" "uuid") OWNER TO "postgres";


-- get_user_documents

CREATE OR REPLACE FUNCTION "public"."get_user_documents"("page_number" integer DEFAULT 0, "items_per_page" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "title" character varying, "kind" "public"."document_kind", "created_at" timestamp without time zone)
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        d.id,
        d.title,
        d.kind,
        d.created_at
    FROM documents d
    WHERE d.user_id = (select auth.uid())
    ORDER BY created_at DESC
    LIMIT items_per_page
    OFFSET (page_number * items_per_page);
END;
$$;

ALTER FUNCTION "public"."get_user_documents"("page_number" integer, "items_per_page" integer) OWNER TO "postgres";


-- get_user_models

CREATE OR REPLACE FUNCTION "public"."get_user_models"("p_bucket_id" "uuid") RETURNS TABLE("id" "uuid", "name" character varying, "description" character varying)
    LANGUAGE "sql" STABLE
    SET search_path = 'public'
AS $$
    SELECT m.id, m.name, m.description
    FROM models m
    WHERE m.bucket_id = p_bucket_id
    ORDER BY m.created_at DESC;
$$;

ALTER FUNCTION "public"."get_user_models"("p_bucket_id" "uuid") OWNER TO "postgres";


-- get_user_profile

CREATE OR REPLACE FUNCTION "public"."get_user_profile"() RETURNS TABLE("id" "uuid", "name" character varying, "username" character varying, "public" boolean)
    LANGUAGE "sql" STABLE
    SET search_path = 'public'
AS $$
    SELECT p.id, p.name, p.username, p.public
    FROM profiles p
    WHERE p.id = auth.uid();
$$;

ALTER FUNCTION "public"."get_user_profile"() OWNER TO "postgres";


-- get_user_prompts

CREATE OR REPLACE FUNCTION "public"."get_user_prompts"() RETURNS TABLE("id" "uuid", "name" character varying, "content" "text")
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.content
    FROM prompts p
    WHERE p.user_id = (select auth.uid());
END;
$$;

ALTER FUNCTION "public"."get_user_prompts"() OWNER TO "postgres";


-- ilike_bucket_courses

CREATE OR REPLACE FUNCTION "public"."ilike_bucket_courses"("p_bucket_id" "uuid", "prefix" "text") RETURNS TABLE("id" "uuid", "name" character varying, "private" boolean)
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY 
    SELECT
        c.id,
        c.name,
        c.private
    FROM courses c
    WHERE c.bucket_id = p_bucket_id
    AND c.name ILIKE prefix || '%'
    LIMIT 5;
END;
$$;

ALTER FUNCTION "public"."ilike_bucket_courses"("p_bucket_id" "uuid", "prefix" "text") OWNER TO "postgres";


-- ilike_bucket_users

CREATE OR REPLACE FUNCTION "public"."ilike_bucket_users"("p_bucket_id" "uuid", "prefix" "text") RETURNS TABLE("id" "uuid", "username" character varying)
    LANGUAGE "plpgsql"
    SECURITY DEFINER
    SET search_path = 'public'
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM bucket_maintainers bm
        WHERE bm.bucket_id = p_bucket_id AND bm.user_id = (select auth.uid())
    ) THEN
        RETURN;  -- Return empty if the user is not maintainer of the bucket
    END IF;

    RETURN QUERY
    SELECT bu.user_id, p.username
    FROM bucket_users bu
    JOIN profiles p ON bu.user_id = p.id
    WHERE bu.bucket_id = p_bucket_id
    AND p.username ILIKE '%' || prefix || '%'
    LIMIT 5;
END;
$$;

ALTER FUNCTION "public"."ilike_bucket_users"("p_bucket_id" "uuid", "prefix" "text") OWNER TO "postgres";


-- ilike_course_files

CREATE OR REPLACE FUNCTION "public"."ilike_course_files"("p_course_id" "uuid", "prefix" "text") RETURNS TABLE("id" "uuid", "course_id" "uuid", "name" character varying, "size" integer, "created_at" timestamp without time zone)
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY 
    SELECT
        f.id,
        f.course_id,
        f.name,
        f.size,
        f.created_at
    FROM files f
    WHERE f.course_id = p_course_id
    AND f.name ILIKE prefix || '%'
    ORDER BY f.created_at DESC
    LIMIT 5;
END;
$$;

ALTER FUNCTION "public"."ilike_course_files"("p_course_id" "uuid", "prefix" "text") OWNER TO "postgres";


-- ilike_courses_files

CREATE OR REPLACE FUNCTION "public"."ilike_courses_files"("p_course_ids" "uuid"[], "prefix" "text") RETURNS TABLE("id" "uuid", "course_id" "uuid", "name" character varying, "size" integer, "created_at" timestamp without time zone)
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY 
    SELECT
        f.id,
        f.course_id,
        f.name,
        f.size,
        f.created_at
    FROM files f
    WHERE f.course_id = ANY(p_course_ids)
    AND f.name ILIKE prefix || '%'
    ORDER BY f.created_at DESC
    LIMIT 5;
END;
$$;

ALTER FUNCTION "public"."ilike_courses_files"("p_course_ids" "uuid"[], "prefix" "text") OWNER TO "postgres";


-- ilike_public_profiles

CREATE OR REPLACE FUNCTION "public"."ilike_public_profiles"("prefix" "text") RETURNS TABLE("id" "uuid", "username" character varying)
    LANGUAGE "sql" STABLE
    SECURITY DEFINER
    SET search_path = 'public'
AS $$
    SELECT p.id, p.username
    FROM profiles p
    WHERE p.public = true
    AND p.username ilike '%' || prefix || '%';
$$;

ALTER FUNCTION "public"."ilike_public_profiles"("prefix" "text") OWNER TO "postgres";


-- ilike_user_chats

CREATE OR REPLACE FUNCTION "public"."ilike_user_chats"("prefix" "text") RETURNS TABLE("id" "uuid", "user_id" "uuid", "title" character varying, "is_favourite" boolean, "created_at" timestamp without time zone)
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        c.id,
        c.user_id,
        c.title,
        c.is_favourite,
        c.created_at
    FROM chats c
    WHERE c.user_id = (SELECT auth.uid())
    AND c.title ILIKE '%' || prefix || '%'
    LIMIT 3;
END;
$$;

ALTER FUNCTION "public"."ilike_user_chats"("prefix" "text") OWNER TO "postgres";


-- ilike_user_documents

CREATE OR REPLACE FUNCTION "public"."ilike_user_documents"("prefix" "text") RETURNS TABLE("id" "uuid", "title" character varying, "kind" "public"."document_kind", "created_at" timestamp without time zone)
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        d.id,
        d.title,
        d.kind,
        d.created_at
    FROM documents d
    WHERE d.user_id = (SELECT auth.uid())
    AND d.title ILIKE '%' || prefix || '%'
    LIMIT 3;
END;
$$;

ALTER FUNCTION "public"."ilike_user_documents"("prefix" "text") OWNER TO "postgres";


-- increase_bucket_size

CREATE OR REPLACE FUNCTION "public"."increase_bucket_size"("p_bucket_id" "uuid", "p_file_size" bigint) RETURNS "void"
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
BEGIN
  UPDATE buckets
  SET size = size + p_file_size
  WHERE id = p_bucket_id;
  
  -- Check if update succeeded
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bucket with ID % not found', p_bucket_id;
  END IF;
END;
$$;

ALTER FUNCTION "public"."increase_bucket_size"("p_bucket_id" "uuid", "p_file_size" bigint) OWNER TO "postgres";


-- insert_feedback

CREATE OR REPLACE FUNCTION "public"."insert_feedback"("p_subject" character varying, "p_content" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
BEGIN
    IF length(p_subject) >= 64 THEN
        RAISE EXCEPTION 'Subject must be less than 64 characters';
    END IF;

    IF length(p_content) >= 512 THEN
        RAISE EXCEPTION 'Content must be less than 512 characters';
    END IF;

    INSERT INTO feedback (user_id, subject, content) 
    VALUES ((select auth.uid()), p_subject, p_content);
END;
$$;

ALTER FUNCTION "public"."insert_feedback"("p_subject" character varying, "p_content" "text") OWNER TO "postgres";


-- match_documents

CREATE OR REPLACE FUNCTION "public"."match_documents"("query_embedding" "extensions"."vector", "course_ids" "uuid"[] DEFAULT NULL::"uuid"[], "file_ids" "uuid"[] DEFAULT NULL::"uuid"[], "retrieve_content" boolean DEFAULT false, "match_threshold" double precision DEFAULT 0.5, "match_count" integer DEFAULT 4) RETURNS TABLE("id" "uuid", "file_id" "uuid", "file_name" character varying, "course_id" "uuid", "course_name" character varying, "page_index" smallint, "content" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    SET search_path = 'public', 'extensions'
AS $$
BEGIN
  IF file_ids IS NULL AND course_ids IS NULL THEN
      RAISE EXCEPTION 'At least one of file_ids or course_ids must be provided';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.file_id,
    p.file_name,
    p.course_id,
    p.course_name,
    p.page_index,
    CASE WHEN retrieve_content THEN p.content ELSE NULL END as content,
    (1 - (p.embedding <=> query_embedding)) AS similarity
  FROM pages p
  WHERE 
    (1 - (p.embedding <=> query_embedding)) > match_threshold
    AND (file_ids   IS NULL OR p.file_id   = ANY(file_ids))
    AND (course_ids IS NULL OR p.course_id = ANY(course_ids))
  ORDER BY 
    similarity DESC
  LIMIT match_count;
END;
$$;

ALTER FUNCTION "public"."match_documents"("query_embedding" "extensions"."vector", "course_ids" "uuid"[], "file_ids" "uuid"[], "retrieve_content" boolean, "match_threshold" double precision, "match_count" integer) OWNER TO "postgres";


-- remove_bucket_users

CREATE OR REPLACE FUNCTION "public"."remove_bucket_users"("p_bucket_id" "uuid", "p_user_ids" "uuid"[]) RETURNS int 
    LANGUAGE "plpgsql"
    SECURITY DEFINER
    SET search_path = 'public'
AS $$
DECLARE
    removed_count int;
BEGIN
    -- Check if the current user is a maintainer of the bucket
    IF NOT EXISTS (
        SELECT 1
        FROM bucket_maintainers bm
        WHERE bm.bucket_id = p_bucket_id AND bm.user_id = (select auth.uid())
    ) THEN
        RETURN 0;  -- Return 0 if the user is not a maintainer
    END IF;

    -- Delete the specified users from bucket_users
    WITH deleted_rows AS (
        DELETE FROM bucket_users bu
        WHERE bu.bucket_id = p_bucket_id 
        AND bu.user_id = ANY(p_user_ids)
        RETURNING bu.user_id
    )
    SELECT count(*) INTO removed_count FROM deleted_rows;
    
    -- Update the users_count in the buckets table
    IF removed_count > 0 THEN
        UPDATE buckets
        SET users_count = users_count - removed_count
        WHERE id = p_bucket_id;
    END IF;
    
    RETURN removed_count;
END;
$$;

ALTER FUNCTION "public"."remove_bucket_users"("p_bucket_id" "uuid", "p_user_ids" "uuid"[]) OWNER TO "postgres";


-- set_is_favourite

CREATE OR REPLACE FUNCTION "public"."set_is_favourite"("p_chat_id" "uuid", "p_is_favourite" boolean) RETURNS "void"
    LANGUAGE "sql"
    SET search_path = 'public'
AS $$
    UPDATE chats
    SET is_favourite = p_is_favourite
    WHERE id = p_chat_id
    AND (user_id = (SELECT auth.uid()));
$$;

ALTER FUNCTION "public"."set_is_favourite"("p_chat_id" "uuid", "p_is_favourite" boolean) OWNER TO "postgres";


-- get_chat_title

CREATE OR REPLACE FUNCTION "public"."get_chat_title"("p_chat_id" "uuid") RETURNS TABLE("title" character varying)
    LANGUAGE "sql" STABLE
    SET search_path = 'public'
AS $$
    SELECT title
    FROM chats
    WHERE id = p_chat_id
    AND user_id = (SELECT auth.uid())
    LIMIT 1;
$$;

ALTER FUNCTION "public"."get_chat_title"("p_chat_id" "uuid") OWNER TO "postgres";


-- get_chat

CREATE OR REPLACE FUNCTION "public"."get_chat"("p_chat_id" "uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "title" character varying, "is_favourite" boolean, "created_at" timestamp without time zone)
    LANGUAGE "sql" STABLE
    SET search_path = 'public'
AS $$
    SELECT *
    FROM chats
    WHERE id = p_chat_id
    AND user_id = (SELECT auth.uid())
    LIMIT 1;
$$;

ALTER FUNCTION "public"."get_chat"("p_chat_id" "uuid") OWNER TO "postgres";


-- update_chat_title

CREATE OR REPLACE FUNCTION "public"."update_chat_title"("p_chat_id" "uuid", "p_title" character varying) RETURNS "void"
    LANGUAGE "sql"
    SET search_path = 'public'
AS $$
    UPDATE chats
    SET title = p_title
    WHERE id = p_chat_id
    AND (user_id = (SELECT auth.uid()));
$$;

ALTER FUNCTION "public"."update_chat_title"("p_chat_id" "uuid", "p_title" character varying) OWNER TO "postgres";


-- update_correction_prompt

CREATE OR REPLACE FUNCTION "public"."update_correction_prompt"("p_id" "uuid", "p_content" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
BEGIN
    UPDATE prompts
    SET content = p_content
    WHERE id = p_id
    AND user_id = (SELECT auth.uid());
END;
$$;

ALTER FUNCTION "public"."update_correction_prompt"("p_id" "uuid", "p_content" "text") OWNER TO "postgres";


-- update_document_title

CREATE OR REPLACE FUNCTION "public"."update_document_title"("p_id" "uuid", "p_title" character varying) RETURNS "void"
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
BEGIN
    UPDATE documents
    SET title = p_title
    WHERE id = p_id AND user_id = (SELECT auth.uid());
END;
$$;

ALTER FUNCTION "public"."update_document_title"("p_id" "uuid", "p_title" character varying) OWNER TO "postgres";


-- update_profile

CREATE OR REPLACE FUNCTION "public"."update_profile"("p_name" character varying, "p_username" character varying, "p_public" boolean) RETURNS "void"
    LANGUAGE "plpgsql"
    SET search_path = 'public'
AS $$
BEGIN
    UPDATE profiles
    SET name = p_name,
        username = p_username,
        public = p_public
    WHERE id = (SELECT auth.uid());
END;
$$;

ALTER FUNCTION "public"."update_profile"("p_name" character varying, "p_username" character varying, "p_public" boolean) OWNER TO "postgres";


-- update_status_to_failed

CREATE OR REPLACE FUNCTION "public"."update_status_to_failed"(
  p_task_id UUID,
  p_bucket_id UUID
) RETURNS VOID
    LANGUAGE plpgsql
    SET search_path = 'public'
AS $$
BEGIN
  UPDATE tasks
  SET status = 'failed'
  WHERE id = p_task_id;
  
  UPDATE buckets
  SET size = size - (SELECT file_size FROM tasks WHERE id = p_task_id)
  WHERE id = p_bucket_id;
END;
$$;

ALTER FUNCTION "public"."update_status_to_failed"("p_task_id" "uuid", "p_bucket_id" "uuid") OWNER TO "postgres";


-- Policies

-- buckets table policies

-- Allow users to select buckets they are members of.
CREATE POLICY "Allow users to select buckets they are members of" ON "public"."buckets"
FOR SELECT
TO "authenticated"
USING ("id" IN ( SELECT "bucket_users"."bucket_id"
   FROM "public"."bucket_users"
  WHERE ("bucket_users"."user_id" = ( SELECT "auth"."uid"() AS "uid"))));

-- Allow authenticated users to select buckets they maintain.
CREATE POLICY "Authenticated users can select buckets they maintain" ON "public"."buckets"
FOR SELECT
TO "authenticated"
USING ("id" IN ( SELECT "bucket_maintainers"."bucket_id"
   FROM "public"."bucket_maintainers"
  WHERE ("bucket_maintainers"."user_id" = ( SELECT "auth"."uid"() AS "uid"))));


-- bucket_maintainers table policies

CREATE POLICY "Authenticated users can select their bucket maintainer relationships" ON "public"."bucket_maintainers"
FOR SELECT
TO "authenticated"
USING ("user_id" = ( SELECT "auth"."uid"() AS "uid"));


-- bucket_users table policies

CREATE POLICY "Authenticated users can select their bucket user relationships" ON "public"."bucket_users"
FOR SELECT
TO "authenticated"
USING ("user_id" = ( SELECT "auth"."uid"() AS "uid"));


-- courses table policies

CREATE POLICY "Authenticated users can select courses that belong to buckets of which they are users" ON "public"."courses"
FOR SELECT
TO "authenticated"
USING ("bucket_id" IN ( SELECT "bucket_users"."bucket_id"
   FROM "public"."bucket_users"
  WHERE ("bucket_users"."user_id" = ( SELECT "auth"."uid"() AS "uid"))));

CREATE POLICY "Authenticated users can select courses they maintain" ON "public"."courses"
FOR SELECT
TO "authenticated"
USING ("id" IN ( SELECT "course_maintainers"."course_id"
   FROM "public"."course_maintainers"
  WHERE ("course_maintainers"."user_id" = ( SELECT "auth"."uid"() AS "uid"))));


-- course_maintainers table policies

CREATE POLICY "Authenticated users can select their course maintainer relation" ON "public"."course_maintainers"
FOR SELECT
TO "authenticated"
USING ("user_id" = ( SELECT "auth"."uid"() AS "uid"));


-- chats table policies

CREATE POLICY "Allow users to select their own chats" ON "public"."chats"
FOR SELECT
TO "authenticated"
USING (( SELECT "auth"."uid"() AS "uid") = "user_id");

CREATE POLICY "Users can update their own chats" ON "public"."chats"
FOR UPDATE
TO "authenticated"
USING (( SELECT "auth"."uid"() AS "uid") = "user_id")
WITH CHECK (( SELECT "auth"."uid"() AS "uid") = "user_id");

CREATE POLICY "Allow users to delete their own chats" ON "public"."chats"
FOR DELETE
TO "authenticated"
USING (( SELECT "auth"."uid"() AS "uid") = "user_id");


-- messages table policies

CREATE POLICY "Allow users to select messages in their own chats" ON "public"."messages"
FOR SELECT
TO "authenticated"
USING ("chat_id" IN ( SELECT "chats"."id"
   FROM "public"."chats"
  WHERE ("chats"."user_id" = ( SELECT "auth"."uid"() AS "uid"))));


-- documents table policies

CREATE POLICY "Users can select their own documents" ON "public"."documents"
FOR SELECT
TO "authenticated"
USING (( SELECT "auth"."uid"() AS "uid") = "user_id");

CREATE POLICY "Users can update their own documents" ON "public"."documents"
FOR UPDATE
TO "authenticated"
USING (( SELECT "auth"."uid"() AS "uid") = "user_id")
WITH CHECK (( SELECT "auth"."uid"() AS "uid") = "user_id");

CREATE POLICY "Users can delete their own documents" ON "public"."documents"
FOR DELETE
TO "authenticated"
USING (( SELECT "auth"."uid"() AS "uid") = "user_id");


-- files table policies

CREATE POLICY "Allow authenticated users to select files" ON "public"."files"
FOR SELECT
TO "authenticated"
USING (true);


-- feedback table policies

CREATE POLICY "Allow users to create feedback entries" ON "public"."feedback"
FOR INSERT
TO "authenticated"
WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("length"(("subject")::"text") < 64) AND ("length"("content") < 512));


-- user_invitations table policies

CREATE POLICY "Allow users to select their invitations" ON "public"."user_invitations"
FOR SELECT
TO "authenticated"
USING ((( SELECT "auth"."uid"() AS "uid") = "origin") OR (( SELECT "auth"."uid"() AS "uid") = "target"));

CREATE POLICY "Allow deletion of invitation by origin" ON "public"."user_invitations"
FOR DELETE
TO "authenticated"
USING (( SELECT "auth"."uid"() AS "uid") = "origin");

CREATE POLICY "Allow deletion of invitation by target" ON "public"."user_invitations"
FOR DELETE
TO "authenticated"
USING (( SELECT "auth"."uid"() AS "uid") = "target");


-- bucket_maintainer_invitations table policies

CREATE POLICY "Allow users to select their invitations" ON "public"."bucket_maintainer_invitations"
FOR SELECT
TO "authenticated"
USING ((( SELECT "auth"."uid"() AS "uid") = "origin") OR (( SELECT "auth"."uid"() AS "uid") = "target"));

CREATE POLICY "Allow deletion of invitation by origin" ON "public"."bucket_maintainer_invitations"
FOR DELETE
TO "authenticated"
USING (( SELECT "auth"."uid"() AS "uid") = "origin");

CREATE POLICY "Allow deletion of invitation by target" ON "public"."bucket_maintainer_invitations"
FOR DELETE
TO "authenticated"
USING (( SELECT "auth"."uid"() AS "uid") = "target");


-- course_maintainer_invitations table policies

CREATE POLICY "Allow users to select their invitations" ON "public"."course_maintainer_invitations"
FOR SELECT
TO "authenticated"
USING ((( SELECT "auth"."uid"() AS "uid") = "origin") OR (( SELECT "auth"."uid"() AS "uid") = "target"));

CREATE POLICY "Allow deletion of invitation by origin" ON "public"."course_maintainer_invitations"
FOR DELETE
TO "authenticated"
USING (( SELECT "auth"."uid"() AS "uid") = "origin");

CREATE POLICY "Allow deletion of invitation by target" ON "public"."course_maintainer_invitations"
FOR DELETE
TO "authenticated"
USING (( SELECT "auth"."uid"() AS "uid") = "target");


-- tasks table policies

CREATE POLICY "Allow authenticated users to select tasks that belong to a course they maintain" ON "public"."tasks"
FOR SELECT
TO "authenticated"
USING ("course_id" IN ( SELECT "course_maintainers"."course_id"
   FROM "public"."course_maintainers"
  WHERE ("course_maintainers"."user_id" = ( SELECT "auth"."uid"() AS "uid"))));


-- profiles table policies

CREATE POLICY "Allow authenticated users to select profiles" ON "public"."profiles"
FOR SELECT
TO "authenticated"
USING (true);

CREATE POLICY "Allow authenticated users to insert a profile with their own Id" ON "public"."profiles"
FOR INSERT
TO "authenticated"
WITH CHECK (( SELECT "auth"."uid"() AS "uid") = "id");

CREATE POLICY "Allow authenticated users to update their own profile" ON "public"."profiles"
FOR UPDATE
TO "authenticated"
USING (( SELECT "auth"."uid"() AS "uid") = "id")
WITH CHECK (( SELECT "auth"."uid"() AS "uid") = "id");


-- prompts table policies

CREATE POLICY "Allow users to select their own prompts" ON "public"."prompts"
FOR SELECT
TO "authenticated"
USING (( SELECT "auth"."uid"() AS "uid") = "user_id");

CREATE POLICY "Allow users to update their own prompts" ON "public"."prompts"
FOR UPDATE
TO "authenticated"
USING (( SELECT "auth"."uid"() AS "uid") = "user_id")
WITH CHECK (( SELECT "auth"."uid"() AS "uid") = "user_id");

CREATE POLICY "Allow users to delete their own prompts" ON "public"."prompts"
FOR DELETE
TO "authenticated"
USING (( SELECT "auth"."uid"() AS "uid") = "user_id");


-- models table policies

CREATE POLICY "Allow users to select models from buckets they are members of" ON "public"."models"
FOR SELECT
TO "authenticated"
USING ("bucket_id" IN ( SELECT "bucket_users"."bucket_id"
   FROM "public"."bucket_users"
  WHERE ("bucket_users"."user_id" = ( SELECT "auth"."uid"() AS "uid"))));

CREATE POLICY "Allow users to select models from buckets they maintain" ON "public"."models"
FOR SELECT
TO "authenticated"
USING ("bucket_id" IN ( SELECT "bucket_maintainers"."bucket_id"
   FROM "public"."bucket_maintainers"
  WHERE ("bucket_maintainers"."user_id" = ( SELECT "auth"."uid"() AS "uid"))));

CREATE POLICY "Allow users to delete models from buckets they maintain" ON "public"."models"
FOR DELETE
TO "authenticated"
USING ("bucket_id" IN ( SELECT "bucket_maintainers"."bucket_id"
   FROM "public"."bucket_maintainers"
  WHERE ("bucket_maintainers"."user_id" = ( SELECT "auth"."uid"() AS "uid"))));



-- Enable Row Level Security

ALTER TABLE "public"."buckets" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."bucket_maintainers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."bucket_users" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."chats" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."course_keys" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."course_users" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."course_maintainers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."files" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."pages" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."user_invitations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."bucket_maintainer_invitations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."course_maintainer_invitations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."prompts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."models" ENABLE ROW LEVEL SECURITY;
