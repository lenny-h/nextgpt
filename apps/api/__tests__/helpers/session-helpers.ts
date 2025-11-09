import { globalTestSessions } from "../setup/global-setup.js";
import { TEST_USERS } from "./auth-helpers.js";

/**
 * Get the cached session cookie for a test user
 * These sessions are created once during global setup
 *
 * @param userKey - The key of the test user (e.g., "USER1_VERIFIED")
 * @returns The session cookie string
 */
export function getTestSession(userKey: keyof typeof TEST_USERS): string {
  const session = globalTestSessions[userKey];

  if (!session) {
    throw new Error(
      `No session found for ${userKey}. ` +
        `Available sessions: ${Object.keys(globalTestSessions).join(", ")}`
    );
  }

  return session;
}

/**
 * Get authentication headers for a test user using cached sessions
 *
 * @param userKey - The key of the test user (e.g., "USER1_VERIFIED")
 * @returns Headers object with Cookie header set
 */
export function getTestAuthHeaders(
  userKey: keyof typeof TEST_USERS
): Record<string, string> {
  return {
    Cookie: getTestSession(userKey),
  };
}
