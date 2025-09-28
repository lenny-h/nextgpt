import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("update_profile function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let originalProfile: any;

  beforeAll(async () => {
    user1Client = await signInUser(
      TEST_USERS.user1.email,
      TEST_USERS.user1.password
    );
    anonymousClient = createUnauthenticatedClient();
    serviceClient = createServiceClient();

    // Store the original profile data to restore after tests
    const { data, error } = await serviceClient
      .from("profiles")
      .select("name, username, public")
      .eq("id", TEST_USERS.user1.id)
      .single();

    if (error) throw error;
    originalProfile = data;
  });

  afterAll(async () => {
    // Restore the original profile data
    if (originalProfile) {
      await serviceClient
        .from("profiles")
        .update({
          name: originalProfile.name,
          username: originalProfile.username,
          public: originalProfile.public,
        })
        .eq("id", TEST_USERS.user1.id);
    }
  });

  it("should allow a user to update their profile", async () => {
    const testData = generateTestData();
    const newName = `Test Name ${testData.timestamp}`;
    const newUsername = `test_user_${testData.uuid.split("-")[0]}`;
    const newPublic = true;

    const { error } = await user1Client.rpc("update_profile", {
      p_name: newName,
      p_username: newUsername,
      p_public: newPublic,
    });

    if (error) throw error;

    // Verify the profile was updated
    const { data, error: fetchError } = await serviceClient
      .from("profiles")
      .select("name, username, public")
      .eq("id", TEST_USERS.user1.id)
      .single();

    if (fetchError) throw fetchError;

    expect(data.name).toBe(newName);
    expect(data.username).toBe(newUsername);
    expect(data.public).toBe(newPublic);
  });

  it("should reject duplicate usernames", async () => {
    // Try to set user1's username to user2's username
    const { data: user2Profile, error: user2ProfileError } = await serviceClient
      .from("profiles")
      .select("username")
      .eq("id", TEST_USERS.user2.id)
      .single();

    if (user2ProfileError) throw user2ProfileError;

    const { error } = await user1Client.rpc("update_profile", {
      p_name: "Test Name",
      p_username: user2Profile.username,
      p_public: false,
    });

    expect(error).not.toBeNull();
    expect(error?.message).toContain(
      'duplicate key value violates unique constraint "profiles_username_unique"'
    );
  });

  it("should not allow unauthenticated users to update profiles", async () => {
    const { error } = await anonymousClient.rpc("update_profile", {
      p_name: "Anonymous Name",
      p_username: "anonymous_user",
      p_public: true,
    });

    if (error) throw error;

    // Expect profile to not be updated
    const { data, error: fetchError } = await serviceClient
      .from("profiles")
      .select("name, username, public")
      .eq("id", TEST_USERS.user1.id)
      .single();

    if (fetchError) throw fetchError;

    expect(data.name).not.toBe("Anonymous Name");
    expect(data.username).not.toBe("anonymous_user");
  });
});
