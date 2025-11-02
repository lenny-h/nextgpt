import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";

export const errorHandler = async (c: Context, next: Function) => {
  try {
    await next();
  } catch (error) {
    console.error(error);

    if (error instanceof HTTPException) {
      return c.text(error.message, error.status);
    }

    return c.text("INTERNAL_SERVER_ERROR", 500);
  }
};
