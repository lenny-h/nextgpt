import { type Context, type Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { auth } from "./auth-server.js";
import { type User } from "./drizzle/schema.js";

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      throw new HTTPException(401, { message: "UNAUTHORIZED" });
    }

    c.set("user", session.user as User);

    return next();
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: "INTERNAL_SERVER_ERROR" });
  }
};
