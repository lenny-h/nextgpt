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
            message: "Bad Request",
            status: 400,
          },
        },
        400
      );
    }

    if (error instanceof Error && "code" in error) {
      switch (error.code) {
        case "23505":
          return c.json(
            {
              error: {
                message: "Resource already exists",
                status: 409,
              },
            },
            409
          );
      }
    }

    return c.json(
      {
        error: {
          message: "Internal Server Error",
          status: 500,
        },
      },
      500
    );
  }
};
