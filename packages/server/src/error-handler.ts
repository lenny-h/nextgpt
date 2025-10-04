import * as z from "zod";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";

export const errorHandler = async (c: Context, next: Function) => {
  try {
    await next();
  } catch (error) {
    console.error(error);

    if (error instanceof HTTPException) {
      return c.json(
        {
          error: {
            message: error.message,
            status: error.status,
          },
        },
        error.status
      );
    }

    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: {
            message: "BAD_REQUEST",
            status: 400,
          },
        },
        400
      );
    }

    return c.json(
      {
        error: {
          message: "INTERNAL_SERVER_ERROR",
          status: 500,
        },
      },
      500
    );
  }
};
