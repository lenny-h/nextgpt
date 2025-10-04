import type { auth } from "@workspace/server/auth-server.js";

declare module "hono" {
  interface ContextVariableMap {
    user: typeof auth.$Infer.Session.user;
  }
}
