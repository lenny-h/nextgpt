import { createServiceClient } from "../../../../src/utils/supabase/service-client.js";
import { generateUUID } from "../../../../src/utils/utils.js";
import { generateTestData, TEST_USERS } from "./utils.js";

/**
 * Creates test pages with embeddings for vector search tests
 */
export async function setupTestPages() {
  const supabase = createServiceClient();

  // Create test bucket
  const testData = generateTestData();

  const bucketId = testData.uuid;

  // Create test courses
  const courseId1 = generateUUID();
  const courseId2 = generateUUID();

  const { error: bucketError } = await supabase.from("buckets").insert({
    id: bucketId,
    name: testData.title,
    owner: TEST_USERS.user1.id,
    max_size: 2 * 1024 * 1024 * 1024, // 2 GB
    type: "small", // One of: "small", "medium", "large", "org"
  });

  if (bucketError) {
    throw bucketError;
  }

  const { error: courseError } = await supabase.from("courses").insert([
    {
      id: courseId1,
      name: "Test Course 1",
      bucket_id: bucketId,
    },
    {
      id: courseId2,
      name: "Test Course 2",
      bucket_id: bucketId,
    },
  ]);

  if (courseError) {
    throw courseError;
  }

  // Create test files
  const fileId1 = generateUUID();
  const fileId2 = generateUUID();

  const { error: fileError } = await supabase.from("files").insert([
    {
      id: fileId1,
      course_id: courseId1,
      name: "Test File 1",
      size: 1000,
    },
    {
      id: fileId2,
      course_id: courseId2,
      name: "Test File 2",
      size: 1500,
    },
  ]);

  if (fileError) {
    throw fileError;
  }

  // Create test pages with embeddings
  const testEmbedding = Array(768)
    .fill(0)
    .map(() => 2 * Math.random() - 1);

  // Create pages for different files and courses
  const pages = [
    {
      id: generateUUID(),
      file_id: fileId1,
      file_name: "Test File 1",
      course_id: courseId1,
      course_name: "Test Course 1",
      content: "This is a test page about quantum physics",
      embedding: JSON.stringify(testEmbedding),
      chapter: 1,
      page_index: 0,
    },
    {
      id: generateUUID(),
      file_id: fileId1,
      file_name: "Test File 1",
      course_id: courseId1,
      course_name: "Test Course 1",
      content: "This is another test page about quantum mechanics",
      embedding: JSON.stringify(testEmbedding),
      chapter: 1,
      page_index: 1,
    },
    {
      id: generateUUID(),
      file_id: fileId2,
      file_name: "Test File 2",
      course_id: courseId2,
      course_name: "Test Course 2",
      content: "This is a test page about relativity",
      embedding: JSON.stringify(testEmbedding),
      chapter: 3,
      page_index: 0,
    },
  ];

  const { error: pageError } = await supabase.from("pages").insert(pages);

  if (pageError) {
    throw pageError;
  }

  return {
    bucketId,
    courseIds: [courseId1, courseId2],
    fileIds: [fileId1, fileId2],
    pages,
  };
}

/**
 * Cleans up all test data
 */
export async function cleanupTestPages(
  bucketId: string,
  courseIds: string[] = [],
  fileIds: string[] = []
) {
  const supabase = createServiceClient();

  const { error: pageError } = await supabase
    .from("pages")
    .delete()
    .in("file_id", fileIds);
  if (pageError) {
    throw pageError;
  }

  const { error: fileError } = await supabase
    .from("files")
    .delete()
    .in("course_id", courseIds);
  if (fileError) {
    throw fileError;
  }

  const { error: courseError } = await supabase
    .from("courses")
    .delete()
    .eq("bucket_id", bucketId);
  if (courseError) {
    throw courseError;
  }

  const { error: bucketError } = await supabase
    .from("buckets")
    .delete()
    .eq("id", bucketId);
  if (bucketError) {
    throw bucketError;
  }
}
