# Test Data Generation for Files and Chunks

This directory contains seed files for initializing the test database with realistic data.

## Files

- `seed-test-users.sql` - Creates test users, buckets, and courses
- `seed-test-files-chunks.sql` - Contains files and chunks data (generated from actual document processing)

## How to Generate Test Data for Files and Chunks

The `seed-test-files-chunks.sql` file can be automatically populated by running the document processor with SQL logging enabled. This gives you realistic test data based on actual document processing.

### Step-by-Step Instructions

1. **Set up SQL logging in your environment**

   Edit your root `.env` file and add:

   ```env
   SQL_LOG_FILE_HOST_PATH=C:/path/to/mono
   SQL_LOG_FILE=/app/packages/server/src/drizzle/__tests__/seed-test-files-chunks.sql
   ```

   **Important:** Use the container path `/app/packages/...` (not your host path). The volume mount in `docker-compose.yml` ensures this file persists on your host machine at `./packages/server/src/drizzle/__tests__/`.

2. **Clear the existing seed file** (optional, if regenerating)

   Open `seed-test-files-chunks.sql` and remove any existing INSERT statements, keeping only the header comment.

3. **Run document processing once**

   Upload a document through the API (using the local-tasks-client). The document processor will:
   - Process the document as normal
   - Log all INSERT statements to the specified file
   - Each INSERT will be formatted as valid SQL that can be executed directly

   **Important:** Use one of the test course IDs from `seed-test-users.sql`:
   - `d0000000-0000-4000-8000-000000000001` (Test Course One)
   - `d0000000-0000-4000-8000-000000000002` (Test Course Two)

4. **Verify the generated SQL**

   Open `seed-test-files-chunks.sql` and verify that INSERT statements have been added:

   ```sql
   INSERT INTO files (id, course_id, name, size, page_count)
   VALUES (...);

   INSERT INTO chunks (id, file_id, file_name, course_id, course_name, embedding, content, page_index, page_number, bbox)
   VALUES (...);
   ```

5. **Restart your test database**

   ```bash
   docker-compose -f docker-compose.test.yml down -v
   docker-compose -f docker-compose.test.yml up -d
   ```

   The database will now include the files and chunks data on initialization.

6. **Disable SQL logging** (recommended)

   Remove or comment out the `SQL_LOG_FILE` variable in your root `.env` file to avoid logging in normal development.

## Notes

- The generated SQL includes actual embeddings (768-dimensional vectors), making it realistic test data
- Each time you process a document with SQL logging enabled, the statements are **appended** to the file
- To regenerate from scratch, clear the file content (except the header) before processing
- The test courses have specific IDs that match references in the seed data
- The SQL file persists on your host machine thanks to the volume mount in `docker-compose.yml`
- The volume mount maps container path `/app/packages/server/src/drizzle/__tests__/` to host path `./packages/server/src/drizzle/__tests__/`

## Test Course IDs

When processing documents for test data generation, use these course IDs:

| Course ID                              | Course Name     | Bucket          | Owner         |
| -------------------------------------- | --------------- | --------------- | ------------- |
| `d0000000-0000-4000-8000-000000000001` | Test Course One | Test Bucket One | Test User One |
| `d0000000-0000-4000-8000-000000000002` | Test Course Two | Test Bucket Two | Test User Two |
