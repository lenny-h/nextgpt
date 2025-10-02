import { Hono } from "hono";
import { GET as healthGet } from "./health/route.js";

const unprotectedApiRouter = new Hono().get("/health", healthGet);

export { unprotectedApiRouter };
export type UnprotectedApiType = typeof unprotectedApiRouter;
