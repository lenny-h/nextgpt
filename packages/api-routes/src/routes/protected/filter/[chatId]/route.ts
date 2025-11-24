import * as z from "zod";

import { isChatOwner } from "@workspace/api-routes/lib/db/queries/chats.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { MyUIMetadata } from "@workspace/api-routes/types/custom-ui-metadata.js";
import { db } from "@workspace/server/drizzle/db.js";
import {
  courses,
  documents,
  files,
  messages,
  prompts,
} from "@workspace/server/drizzle/schema.js";
import { and, desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ chatId: uuidSchema }).strict();

const app = new Hono().get(
  "/",
  validator("param", (value, c) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      return c.text("BAD_REQUEST", 400);
    }
    return parsed.data;
  }),
  async (c) => {
    const { chatId } = c.req.valid("param");
    const user = c.get("user");

    // Verify the user owns the chat
    const isOwner = await isChatOwner({ userId: user.id, chatId });
    if (!isOwner) {
      throw new HTTPException(404, { message: "NOT_FOUND" });
    }

    // Fetch the last user message for the given chatId
    const lastMessageResult = await db
      .select({
        metadata: messages.metadata,
      })
      .from(messages)
      .where(and(eq(messages.chatId, chatId), eq(messages.role, "user")))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    // If no messages or no filter in metadata, return empty filter
    const messageMetadata = lastMessageResult[0]?.metadata as MyUIMetadata;
    if (
      lastMessageResult.length === 0 ||
      !messageMetadata ||
      !messageMetadata?.filter
    ) {
      return c.json({
        bucket: { id: "" },
        courses: [],
        files: [],
        documents: [],
        prompts: [],
      });
    }

    const filter = messageMetadata.filter;

    // Parallelize all database fetches
    const [coursesData, filesData, documentsData, promptsData] =
      await Promise.all([
        // Fetch course details if courses exist
        filter.courses.length > 0
          ? db
              .select({
                id: courses.id,
                name: courses.name,
              })
              .from(courses)
              .where(
                and(
                  eq(courses.bucketId, filter.bucket.id),
                  inArray(
                    courses.id,
                    filter.courses.map((c: { id: string }) => c.id)
                  )
                )
              )
          : Promise.resolve([]),

        // Fetch file details if files exist
        filter.files.length > 0
          ? db
              .select({
                id: files.id,
                name: files.name,
                pageCount: files.pagesCount,
              })
              .from(files)
              .where(
                inArray(
                  files.id,
                  filter.files.map((f: { id: string }) => f.id)
                )
              )
          : Promise.resolve([]),

        // Fetch document details if documents exist (only for regular filter, not practice filter)
        "documents" in filter && filter.documents.length > 0
          ? db
              .select({
                id: documents.id,
                title: documents.title,
                kind: documents.kind,
              })
              .from(documents)
              .where(
                and(
                  eq(documents.userId, user.id),
                  inArray(
                    documents.id,
                    filter.documents.map((d: { id: string }) => d.id)
                  )
                )
              )
          : Promise.resolve([]),

        // Fetch prompt details if prompts exist
        "prompts" in filter && filter.prompts.length > 0
          ? db
              .select({
                id: prompts.id,
                name: prompts.name,
                content: prompts.content,
              })
              .from(prompts)
              .where(
                and(
                  eq(prompts.userId, user.id),
                  inArray(
                    prompts.id,
                    filter.prompts.map((p: { id: string }) => p.id)
                  )
                )
              )
          : Promise.resolve([]),
      ]);

    // Create a map of file IDs to page ranges for practice filters
    const filePageRangeMap = new Map<string, string>();
    if ("studyMode" in filter) {
      filter.files.forEach((f: { id: string; pageRange?: string }) => {
        if (f.pageRange) {
          filePageRangeMap.set(f.id, f.pageRange);
        }
      });
    }

    // Build the frontend filter response
    const frontendFilter = {
      bucket: {
        id: filter.bucket.id,
      },
      courses: coursesData.map((course) => ({
        id: course.id,
        name: course.name,
      })),
      files: filesData.map((file) => ({
        id: file.id,
        name: file.name,
        pageCount: file.pageCount ?? 0,
        ...(filePageRangeMap.has(file.id)
          ? { pageRange: filePageRangeMap.get(file.id) }
          : {}),
      })),
      documents: documentsData.map((doc) => ({
        id: doc.id,
        title: doc.title,
        kind: doc.kind,
      })),
      prompts: promptsData.map((prompt) => ({
        id: prompt.id,
        name: prompt.name,
        content: prompt.content,
      })),
    };

    return c.json(frontendFilter);
  }
);

export default app;
