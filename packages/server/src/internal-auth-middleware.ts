import { type Context, type Next } from "hono";
import { HTTPException } from "hono/http-exception";

export const internalAuthMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("x-internal-secret");
  const expectedSecret = process.env.ENCRYPTION_KEY;

  if (!expectedSecret) {
    throw new HTTPException(500, {
      message: "ENCRYPTION_KEY not configured",
    });
  }

  if (!authHeader || authHeader !== expectedSecret) {
    throw new HTTPException(401, { message: "UNAUTHORIZED" });
  }

  return next();
};
