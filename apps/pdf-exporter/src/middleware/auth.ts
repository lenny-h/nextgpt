import { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { createClient } from "../utils/supabase/server.js";

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const supabase = await createClient(c);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    // Add user to context for use in routes
    c.set("user", user);

    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: "Authentication failed" });
  }
};
