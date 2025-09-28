import { beforeAll, describe, expect, it } from "vitest";
import {
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS } from "../test-utils.js";

describe("get_user_profile function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;

  beforeAll(async () => {
    user1Client = await signInUser(
      TEST_USERS.user1.email,
      TEST_USERS.user1.password
    );
    user2Client = await signInUser(
      TEST_USERS.user2.email,
      TEST_USERS.user2.password
    );
    anonymousClient = createUnauthenticatedClient();
  });

  it("should allow a user to retrieve their own profile", async () => {
    const { data, error } = await user1Client.rpc("get_user_profile");

    if (error) throw error;

    // Verify the profile data matches what we expect
    expect(data.length).toBe(1);
    expect(data[0].id).toBe(TEST_USERS.user1.id);
    expect(data[0].username).toBe(TEST_USERS.user1.username);
  });

  it("should return user2's profile for user2", async () => {
    const { data, error } = await user2Client.rpc("get_user_profile");

    if (error) throw error;

    // Verify the profile data matches what we expect for user2
    expect(data.length).toBe(1);
    expect(data[0].id).toBe(TEST_USERS.user2.id);
    expect(data[0].username).toBe(TEST_USERS.user2.username);
  });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc("get_user_profile");

    if (error) throw error;

    expect(data.length).toBe(0);
  });
});
