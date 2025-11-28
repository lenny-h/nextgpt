import { Hono } from "hono";
import exportPdfRoute from "./export-pdf/route.js";

const protectedApiRouter = new Hono();

protectedApiRouter.route("/export-pdf", exportPdfRoute);

export { protectedApiRouter };
