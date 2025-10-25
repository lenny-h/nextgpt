import { type Context, type Next } from "hono";
import { HTTPException } from "hono/http-exception";

export const internalAuthMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("x-internal-secret");
  const expectedSecret = process.env.INTERNAL_API_SECRET;

  if (!expectedSecret) {
    throw new HTTPException(500, {
      message: "INTERNAL_API_SECRET not configured",
    });
  }

  if (!authHeader || authHeader !== expectedSecret) {
    throw new HTTPException(401, { message: "UNAUTHORIZED" });
  }

  return next();
};
