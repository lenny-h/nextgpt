import { testClient } from "hono/testing";
import { beforeAll, describe, expect, it } from "vitest";
import app, { type ApiAppType } from "../src/app.js";
import { TEST_USERS, getAuthHeaders, signInTestUser } from "./helpers/auth-helpers.js";

/**
 * Example test file demonstrating how to use the auth helpers
 * for testing protected API routes
 */

describe("Protected API Routes - Example", () => {
  // Create the test client from the main app instance
  const client = testClient<ApiAppType>(app);
  
  let user1Cookie: string;
  let user2Cookie: string;

  // Sign in test users before running tests
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

  it("should access protected route with authenticated user", async () => {
    // Call the endpoint using the typed client with authentication headers
    const res = await client.api.protected.profiles.$get(
      {},
      {
        headers: getAuthHeaders(user1Cookie),
      }
    );

    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data).toHaveProperty("username");
    expect(data.username).toBe(TEST_USERS.USER1_VERIFIED.username);
  });

  it("should return 401 without authentication", async () => {
    // Make a request without authentication
    const res = await client.api.protected.profiles.$get();

    expect(res.status).toBe(401);
  });

  it("should isolate data between different users", async () => {
    // Get profile for user 1
    const res1 = await client.api.protected.profiles.$get(
      {},
      {
        headers: getAuthHeaders(user1Cookie),
      }
    );
    const user1Data = await res1.json();
    
    // Get profile for user 2
    const res2 = await client.api.protected.profiles.$get(
      {},
      {
        headers: getAuthHeaders(user2Cookie),
      }
    );
    const user2Data = await res2.json();

    // Verify they are different users
    expect(user1Data.username).toBe(TEST_USERS.USER1_VERIFIED.username);
    expect(user2Data.username).toBe(TEST_USERS.USER2_VERIFIED.username);
    expect(user1Data.username).not.toBe(user2Data.username);
  });
});
