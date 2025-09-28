import { Hono } from "hono";
import { GET as healthGet } from "./health/route.js";

const unprotectedApiRouter = new Hono();

// Health check route
unprotectedApiRouter.get("/health", healthGet);

export { unprotectedApiRouter };
