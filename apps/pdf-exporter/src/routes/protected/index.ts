import { Hono } from "hono";
import { POST as exportPdfPost } from "./export-pdf.js";

const protectedApiRouter = new Hono();

protectedApiRouter.post("/export-pdf", exportPdfPost);

export { protectedApiRouter };
