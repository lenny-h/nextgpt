import { signInAllTestUsers } from "../helpers/auth-helpers.js";

/**
 * Global test sessions cache
 * This stores the authentication cookies for all test users
 * These are set during globalSetup and can be used across all test files
 */
export const globalTestSessions: Record<string, string> = {};

/**
 * Global setup function that runs once before all tests
 * Signs in all test users and caches their session cookies
 */
export default async function globalSetup() {
  console.log("🔐 Signing in test users (global setup)...");

  try {
    const sessions = await signInAllTestUsers();

    // Store sessions in the global cache
    Object.assign(globalTestSessions, sessions);

    console.log("✅ Test users signed in successfully");
    console.log(`   - ${Object.keys(sessions).length} users authenticated`);

    return () => {
      // Teardown function (optional)
      console.log("🧹 Global test teardown complete");
    };
  } catch (error) {
    console.error("❌ Failed to sign in test users:", error);
    throw error;
  }
}
