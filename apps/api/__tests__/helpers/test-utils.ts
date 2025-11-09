/**
 * Common test utilities and helper functions
 */

/**
 * Get internal auth headers for internal API routes
 */
export function getInternalAuthHeaders(): Record<string, string> {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("ENCRYPTION_KEY not configured for tests");
  }
  return {
    "x-internal-secret": secret,
  };
}

/**
 * Assert that a response is a 401 Unauthorized error
 */
export function expectUnauthorized(status: number) {
  if (status !== 401) {
    throw new Error(`Expected 401 Unauthorized but got ${status}`);
  }
}

/**
 * Assert that a response is a 403 Forbidden error
 */
export function expectForbidden(status: number) {
  if (status !== 403) {
    throw new Error(`Expected 403 Forbidden but got ${status}`);
  }
}

/**
 * Assert that a response is a 404 Not Found error
 */
export function expectNotFound(status: number) {
  if (status !== 404) {
    throw new Error(`Expected 404 Not Found but got ${status}`);
  }
}

/**
 * Generate a random UUID for testing
 */
export function generateTestUUID(): string {
  return "00000000-0000-4000-8000-" + Math.random().toString(16).slice(2, 14).padEnd(12, "0");
}
