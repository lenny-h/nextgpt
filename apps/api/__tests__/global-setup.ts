import { signInAllTestUsers, TEST_USERS } from "./helpers/auth-helpers.js";

export default async function setup({ provide }: any) {
  console.log("Global setup: Signing in all test users...");
  try {
    const sessions = await signInAllTestUsers();

    // Map by email for easier lookup in signInTestUser
    const sessionsByEmail: Record<string, string> = {};
    for (const [key, cookie] of Object.entries(sessions)) {
      const user = TEST_USERS[key as keyof typeof TEST_USERS];
      if (user) {
        sessionsByEmail[user.email] = cookie as string;
      }
    }

    provide("authSessions", sessionsByEmail);
    console.log(
      `Global setup: Signed in ${Object.keys(sessions).length} users.`
    );
  } catch (error) {
    console.error("Global setup failed:", error);
    throw error;
  }
}

declare module "vitest" {
  export interface ProvidedContext {
    authSessions: Record<string, string>;
  }
}
