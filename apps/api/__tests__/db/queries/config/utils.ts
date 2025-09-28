import { type SupabaseClient } from "@supabase/supabase-js";
import { type Database } from "../../../../src/types/database.js";
import { generateUUID } from "../../../../src/utils/utils.js";

// Test user credentials
export const TEST_USERS = {
  user1: {
    id: "f4a17ea9-f163-4180-bf67-42ba797ab994",
    email: "lennarth062@gmail.com",
    password: "TestTest12!",
    username: "Vanilla",
  },
  user2: {
    id: "e32c14d9-d037-4e3e-9ab1-0da64f89fdac",
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
