# API Routes Testing

This directory contains automated tests for the API routes package.

## Setup

### 1. Database Seeding

Test users are automatically seeded when you start the Docker containers. The seed script is located at:

- `packages/server/src/drizzle/__tests__/seed-test-users.sql`

This script creates three test users:

| User            | Email                 | Password   | Email Verified | ID                                   |
| --------------- | --------------------- | ---------- | -------------- | ------------------------------------ |
| Test User One   | testuser1@example.com | Test12345! | ✅ Yes         | a0000000-0000-4000-8000-000000000001 |
| Test User Two   | testuser2@example.com | Test12345! | ✅ Yes         | a0000000-0000-4000-8000-000000000002 |
| Test User Three | testuser3@example.com | Test12345! | ❌ No          | a0000000-0000-4000-8000-000000000003 |

The seed script runs automatically on container startup via `docker-compose.yml`.

### 2. Environment Variables

Make sure your environment variables are properly set in `.env.local`:

```env
DATABASE_PASSWORD=postgres
DATABASE_HOST=localhost:5432
BETTER_AUTH_URL=http://localhost:8080
BETTER_AUTH_SECRET=your-better-auth-secret
ENCRYPTION_KEY=your-encryption-key
REDIS_URL=redis://localhost:6379
```

### 3. Running Tests

```bash
# From the API app directory
cd apps/api

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Authentication Helpers

The `helpers/auth-helpers.ts` file provides utilities for authenticating test users in your tests.

### Available Functions

#### `signInTestUser(email: string, password: string): Promise<string>`

Signs in a test user and returns the session cookie string.

```typescript
import { signInTestUser } from "./helpers/auth-helpers.js";

const cookie = await signInTestUser("testuser1@example.com", "Test12345!");
```

#### `signInAllTestUsers(): Promise<Record<string, string>>`

Signs in all three test users and returns a map of their cookies.

```typescript
import { signInAllTestUsers } from "./helpers/auth-helpers.js";

const sessions = await signInAllTestUsers();
// Returns: { USER1_VERIFIED: "...", USER2_VERIFIED: "...", USER3_UNVERIFIED: "..." }
```

#### `getAuthHeaders(cookieString: string): Record<string, string>`

Converts a cookie string into headers object for making authenticated requests.

```typescript
import { getAuthHeaders } from "./helpers/auth-helpers.js";

const headers = getAuthHeaders(cookie);
// Returns: { Cookie: "better-auth.session_token=..." }
```

#### `getTestUserAuthHeaders(email: string, password: string): Promise<Record<string, string>>`

Convenience function that signs in and returns headers in one call.

```typescript
import { getTestUserAuthHeaders } from "./helpers/auth-helpers.js";

const headers = await getTestUserAuthHeaders(
  "testuser1@example.com",
  "Test12345!"
);
```

### Available Constants

#### `TEST_USERS`

Object containing all test user credentials:

```typescript
import { TEST_USERS } from "./helpers/auth-helpers.js";

console.log(TEST_USERS.USER1_VERIFIED);
// {
//   id: "a0000000-0000-4000-8000-000000000001",
//   email: "testuser1@example.com",
//   username: "testuser1",
//   name: "Test User One",
//   password: "Test12345!"
// }
```

#### `TEST_USER_IDS`

Object containing just the user IDs:

```typescript
import { TEST_USER_IDS } from "./helpers/auth-helpers.js";

console.log(TEST_USER_IDS.USER1_VERIFIED); // "a0000000-0000-4000-8000-000000000001"
```

## Writing Tests

### Example: Testing Protected Routes

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import app from "../src/index.js";
import {
  TEST_USERS,
  signInTestUser,
  getAuthHeaders,
} from "./helpers/auth-helpers.js";

describe("Protected Route Tests", () => {
  let userCookie: string;

  beforeAll(async () => {
    // Sign in before running tests
    userCookie = await signInTestUser(
      TEST_USERS.USER1_VERIFIED.email,
      TEST_USERS.USER1_VERIFIED.password
    );
  });

  it("should access protected endpoint", async () => {
    const request = new Request("http://localhost/api/protected/profiles", {
      headers: getAuthHeaders(userCookie),
    });

    const response = await app.fetch(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.username).toBe(TEST_USERS.USER1_VERIFIED.username);
  });

  it("should reject unauthenticated requests", async () => {
    const request = new Request("http://localhost/api/protected/profiles");
    const response = await app.fetch(request);

    expect(response.status).toBe(401);
  });
});
```

### Example: Testing Multiple Users

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import app from "../src/index.js";
import {
  TEST_USERS,
  signInTestUser,
  getAuthHeaders,
} from "./helpers/auth-helpers.js";

describe("Multi-user Tests", () => {
  let user1Cookie: string;
  let user2Cookie: string;

  beforeAll(async () => {
    user1Cookie = await signInTestUser(
      TEST_USERS.USER1_VERIFIED.email,
      TEST_USERS.USER1_VERIFIED.password
    );

    user2Cookie = await signInTestUser(
      TEST_USERS.USER2_VERIFIED.email,
      TEST_USERS.USER2_VERIFIED.password
    );
  });

  it("should isolate data between users", async () => {
    // Request as user 1
    const request1 = new Request("http://localhost/api/protected/buckets", {
      headers: getAuthHeaders(user1Cookie),
    });
    const response1 = await app.fetch(request1);
    const user1Data = await response1.json();

    // Request as user 2
    const request2 = new Request("http://localhost/api/protected/buckets", {
      headers: getAuthHeaders(user2Cookie),
    });
    const response2 = await app.fetch(request2);
    const user2Data = await response2.json();

    // Verify isolation
    expect(user1Data).not.toEqual(user2Data);
  });
});
```

### Example: Testing Unverified Email User

```typescript
import { describe, it, expect } from "vitest";
import { TEST_USERS, signInTestUser } from "./helpers/auth-helpers.js";

describe("Email Verification Tests", () => {
  it("should not allow sign in with unverified email", async () => {
    // Attempt to sign in with unverified email user
    await expect(
      signInTestUser(
        TEST_USERS.USER3_UNVERIFIED.email,
        TEST_USERS.USER3_UNVERIFIED.password
      )
    ).rejects.toThrow();
  });
});
```

## Troubleshooting

### Tests failing with "No set-cookie header"

Make sure:

1. Docker containers are running (`docker-compose up -d`)
2. Database has been seeded with test users
3. Environment variables are set correctly
4. Redis is running and accessible

### Tests failing with "User not found"

The database might not have been seeded. Restart the containers:

```bash
docker-compose down -v  # ⚠️ This deletes all data
docker-compose up -d
```
