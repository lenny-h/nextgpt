import { describe, expect, it, vi } from "vitest";
import {
  getUserIdByUsername,
  getUserIdsByUsernames,
} from "../../../src/lib/db/queries/users.js";
import { TEST_USERS } from "./config/utils.js";

// Mock server-only module
vi.mock("server-only", () => {
  return {
    // mock server-only module
  };
});

describe("users.ts query tests", async () => {
  it("should get user ID by username", async () => {
    // Act
    const userId = await getUserIdByUsername(TEST_USERS.user1.username);

    // Assert
    expect(userId).toBe(TEST_USERS.user1.id);
  });

  it("should get multiple user IDs by usernames", async () => {
    // Act
    const users = await getUserIdsByUsernames([
      TEST_USERS.user1.username,
      TEST_USERS.user2.username,
    ]);

    // Assert
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBe(2);

    const user1 = users.find((u) => u.username === TEST_USERS.user1.username);
    const user2 = users.find((u) => u.username === TEST_USERS.user2.username);

    expect(user1).toBeDefined();
    expect(user2).toBeDefined();
    expect(user1?.id).toBe(TEST_USERS.user1.id);
    expect(user2?.id).toBe(TEST_USERS.user2.id);
  });
});
