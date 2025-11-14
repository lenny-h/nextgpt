import { type Context } from "hono";
import { logger as honoLogger } from "hono/logger";

const fakeLogger = async (c: Context, next: Function) => {
  return await next();
};

export const conditionalLogger =
  process.env.NODE_ENV === "development" ? honoLogger() : fakeLogger;
