import { Hono } from "hono";
import embeddingsRoute from "./embeddings/route.js";

export const internalApiRouter = new Hono().route(
  "/embeddings",
  embeddingsRoute
);

export type InternalApiType = typeof internalApiRouter;
