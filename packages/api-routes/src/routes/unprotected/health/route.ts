import { type Context, Hono } from "hono";
import { HTTPException } from "hono/http-exception";

export const healthRouter = new Hono();

export async function GET(c: Context) {
  try {
    const requiredEnvVars = ["ALLOWED_ORIGINS"];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      throw new HTTPException(500, {
        message: "Missing required environment variables",
      });
    }

    return c.json(
      {
        message: "API is running",
        timestamp: new Date().toISOString(),
      },
      200
    );
  } catch (error) {
    throw new HTTPException(500, { message: "Health check failed" });
  }
}
