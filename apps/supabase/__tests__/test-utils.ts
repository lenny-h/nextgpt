import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../database.js";

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const TEST_USERS = {
  user1: {
    id: "f80eb7c2-6099-4418-b2ef-a49d4b1de3b7",
    email: "lennarth062@gmail.com",
    password: "TestTest12!",
    username: "Vanilla",
  },
  user2: {
    id: "e980d35b-e86a-4d5e-bf5e-ed3d4824916c",
    email: "lennarth063@gmail.com",
    password: "Test123456!",
    username: "Chocolate",
  },
};

// Helper to generate random test data
export function generateTestData() {
  return {
    uuid: generateUUID(),
    timestamp: new Date().toISOString(),
    title: `Test ${Math.random().toString(36).substring(7)}`,
  };
}

// Helper to clean up test data
export async function cleanupTestData(
  supabase: SupabaseClient<Database>,
  table: keyof Database["public"]["Tables"],
  column: string,
  value: string
) {
  await supabase.from(table).delete().eq(column, value);
}
