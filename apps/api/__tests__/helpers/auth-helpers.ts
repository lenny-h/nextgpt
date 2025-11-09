import { auth } from "@workspace/server/auth-server.js";

/**
 * Test user IDs matching the seed-test-users.sql script
 */
export const TEST_USER_IDS = {
  USER1_VERIFIED: "a0000000-0000-4000-8000-000000000001",
  USER2_VERIFIED: "a0000000-0000-4000-8000-000000000002",
  USER3_UNVERIFIED: "a0000000-0000-4000-8000-000000000003",
} as const;

/**
 * Test user credentials for authentication
 */
export const TEST_USERS = {
  USER1_VERIFIED: {
    id: TEST_USER_IDS.USER1_VERIFIED,
    email: "testuser1@example.com",
    username: "testuser1",
    name: "Test User One",
    password: "Test12345!",
  },
  USER2_VERIFIED: {
    id: TEST_USER_IDS.USER2_VERIFIED,
    email: "testuser2@example.com",
    username: "testuser2",
    name: "Test User Two",
    password: "Test12345!",
  },
  USER3_UNVERIFIED: {
    id: TEST_USER_IDS.USER3_UNVERIFIED,
    email: "testuser3@example.com",
    username: "testuser3",
    name: "Test User Three",
    password: "Test12345!",
  },
} as const;

/**
 * Sign in a test user and return the session cookies
 * Uses better-auth's API to programmatically sign in
 */
export async function signInTestUser(email: string, password: string): Promise<string> {
  const response = await auth.api.signInEmail({
    body: {
      email,
      password,
    },
    asResponse: true,
  });

  const setCookieHeader = response.headers.get("set-cookie");
  if (!setCookieHeader) {
    throw new Error("No set-cookie header found in sign-in response");
  }

  return setCookieHeader;
}

/**
 * Sign in all test users and return their session cookies
 * Returns a map of user keys to their cookie strings
 */
export async function signInAllTestUsers(): Promise<Record<string, string>> {
  const sessions: Record<string, string> = {};

  for (const [key, user] of Object.entries(TEST_USERS)) {
    try {
      sessions[key] = await signInTestUser(user.email, user.password);
    } catch (error) {
      console.error(`Failed to sign in ${key}:`, error);
      throw error;
    }
  }

  return sessions;
}

/**
 * Get authentication headers for a session cookie string
 * This can be used to make authenticated requests in tests
 */
export function getAuthHeaders(cookieString: string): Record<string, string> {
  return {
    Cookie: cookieString,
  };
}

/**
 * Helper to sign in and get auth headers in one call
 */
export async function getTestUserAuthHeaders(email: string, password: string): Promise<Record<string, string>> {
  const cookie = await signInTestUser(email, password);
  return getAuthHeaders(cookie);
}
