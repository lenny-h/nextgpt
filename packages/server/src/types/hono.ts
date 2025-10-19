import { type User } from "../drizzle/schema.js";

declare module "hono" {
  interface ContextVariableMap {
    user: User;
  }
}
