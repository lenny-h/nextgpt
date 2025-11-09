# Test Authentication Optimization

## Overview

This migration optimizes test authentication by signing in test users **once globally** instead of separately in each test file's `beforeAll` hook. This significantly reduces test execution time, especially when running the full test suite.

## What Changed

### Before (Old Pattern)

Each test file signed in users individually:

```typescript
import {
  signInTestUser,
  getAuthHeaders,
  TEST_USERS,
} from "../helpers/auth-helpers.js";

describe("My Tests", () => {
  let user1Cookie: string;
  let user2Cookie: string;

  beforeAll(async () => {
    // ❌ Signs in for EACH test file
    user1Cookie = await signInTestUser(
      TEST_USERS.USER1_VERIFIED.email,
      TEST_USERS.USER1_VERIFIED.password
    );

    user2Cookie = await signInTestUser(
      TEST_USERS.USER2_VERIFIED.email,
      TEST_USERS.USER2_VERIFIED.password
    );
  });

  it("should do something", async () => {
    const res = await client.api.protected.something.$get(
      {},
      { headers: getAuthHeaders(user1Cookie) }
    );
  });
});
```

### After (New Pattern)

Users are signed in once globally, sessions are reused:

```typescript
import { getTestAuthHeaders } from "../helpers/session-helpers.js";
import { TEST_USER_IDS } from "../helpers/auth-helpers.js";

describe("My Tests", () => {
  // ✅ No more beforeAll for authentication!
  // ✅ No more user cookie variables!

  it("should do something", async () => {
    const res = await client.api.protected.something.$get(
      {},
      { headers: getTestAuthHeaders("USER1_VERIFIED") }
    );
  });
});
```

## New Files Created

1. **`__tests__/setup/global-setup.ts`** - Global setup that runs once before all tests
2. **`__tests__/helpers/session-helpers.ts`** - Helper functions to access cached sessions
3. **`vitest.config.mts`** - Updated to use globalSetup

## Migration Steps

### Step 1: Update Imports

**Remove:**

```typescript
import {
  signInTestUser,
  getAuthHeaders,
  TEST_USERS,
} from "../helpers/auth-helpers.js";
```

**Add:**

```typescript
import { getTestAuthHeaders } from "../helpers/session-helpers.js";
import { TEST_USER_IDS } from "../helpers/auth-helpers.js"; // Only if needed for cleanup
```

### Step 2: Remove beforeAll Authentication

**Remove this entire block:**

```typescript
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
```

### Step 3: Update Authentication Calls

**Replace:**

```typescript
{
  headers: getAuthHeaders(user1Cookie);
}
```

**With:**

```typescript
{
  headers: getTestAuthHeaders("USER1_VERIFIED");
}
```

**Replace:**

```typescript
{
  headers: getAuthHeaders(user2Cookie);
}
```

**With:**

```typescript
{
  headers: getTestAuthHeaders("USER2_VERIFIED");
}
```

## Available Test Users

You can use any of these user keys with `getTestAuthHeaders()`:

- `"USER1_VERIFIED"` - Verified test user 1
- `"USER2_VERIFIED"` - Verified test user 2
- `"USER3_UNVERIFIED"` - Unverified test user 3

## Example: Full Migration

### Before

```typescript
import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app, { type ApiAppType } from "../../src/app.js";
import {
  TEST_USERS,
  TEST_USER_IDS,
  getAuthHeaders,
  signInTestUser,
} from "../helpers/auth-helpers.js";
import { cleanupUserChats } from "../helpers/cleanup-helpers.js";

describe("Protected API Routes - Chats", () => {
  const client = testClient<ApiAppType>(app);

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

  afterAll(async () => {
    await cleanupUserChats(TEST_USER_IDS.USER1_VERIFIED);
    await cleanupUserChats(TEST_USER_IDS.USER2_VERIFIED);
  });

  it("should return chats", async () => {
    const res = await client.api.protected.chats.$get(
      { query: { pageNumber: "0", itemsPerPage: "10" } },
      { headers: getAuthHeaders(user1Cookie) }
    );
    expect(res.status).toBe(200);
  });
});
```

### After

```typescript
import { testClient } from "hono/testing";
import { afterAll, describe, expect, it } from "vitest";
import app, { type ApiAppType } from "../../src/app.js";
import { TEST_USER_IDS } from "../helpers/auth-helpers.js";
import { cleanupUserChats } from "../helpers/cleanup-helpers.js";
import { getTestAuthHeaders } from "../helpers/session-helpers.js";

describe("Protected API Routes - Chats", () => {
  const client = testClient<ApiAppType>(app);

  afterAll(async () => {
    await cleanupUserChats(TEST_USER_IDS.USER1_VERIFIED);
    await cleanupUserChats(TEST_USER_IDS.USER2_VERIFIED);
  });

  it("should return chats", async () => {
    const res = await client.api.protected.chats.$get(
      { query: { pageNumber: "0", itemsPerPage: "10" } },
      { headers: getTestAuthHeaders("USER1_VERIFIED") }
    );
    expect(res.status).toBe(200);
  });
});
```

## Benefits

1. **Faster Tests** - User sign-in happens once instead of N times (where N = number of test files)
2. **Simpler Code** - No more `beforeAll` hooks for authentication
3. **Less Duplication** - Authentication logic is centralized
4. **Easier Maintenance** - Changes to auth only need to happen in one place

## Testing the Migration

Run the test suite to ensure everything works:

```bash
pnpm run test
```

Or run with coverage:

```bash
pnpm run test:coverage
```

## Files to Migrate

All test files in `apps/api/__tests__/routes/` that use authentication:

- ✅ `buckets.test.ts` (already migrated)
- ⏳ `chats.test.ts`
- ⏳ `chat-favorites.test.ts`
- ⏳ `courses.test.ts`
- ⏳ `documents.test.ts`
- ⏳ `feedback.test.ts`
- ⏳ `internal.test.ts`
- ⏳ `invitations.test.ts`
- ⏳ `messages.test.ts`
- ⏳ `models.test.ts`
- ⏳ `profiles.test.ts`
- ⏳ `prompts.test.ts`
- ⏳ `search.test.ts`
- ✅ `unprotected.test.ts` (no auth needed)

## Troubleshooting

### Error: "No session found for USER1_VERIFIED"

This means the global setup didn't run or failed. Make sure:

1. `vitest.config.mts` has `globalSetup` configured
2. The global setup file path is correct
3. Test users exist in the database (run seed script if needed)

### Tests still slow?

If tests are still taking a long time after migration, check that:

1. All test files have been migrated
2. No test files are still calling `signInTestUser()` directly
3. Database cleanup is efficient
