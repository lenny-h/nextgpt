import { Hono } from "hono";
import { validator } from "hono/validator";
import DOMPurify from "isomorphic-dompurify";
import { chromium } from "playwright";
import { createPDFTemplate } from "../../../utils/html-template.js";
import { exportPdfSchema } from "./schema.js";

const exportPdf = async ({
  title,
  content,
}: {
  title?: string;
  content: string;
}): Promise<Uint8Array> => {
  // Sanitize the content to prevent XSS
  const sanitizedContent = DOMPurify.sanitize(content, {
    FORBID_TAGS: ["script", "iframe", "object", "embed"],
    FORBID_ATTR: ["onclick", "onload", "onerror"],
  });

  const htmlContent = createPDFTemplate({
    title,
    content: sanitizedContent,
  });

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  // Remove the script tag before generating the PDF
  await page.evaluate(() => {
    const script = document.querySelector("script");
    script?.remove();
  });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "2cm",
      right: "2cm",
      bottom: "2cm",
      left: "2cm",
    },
  });

  await browser.close();

  return pdfBuffer;
};

const app = new Hono().post(
  "/",
  validator("json", async (value, c) => {
    const parsed = exportPdfSchema.safeParse(value);
    if (!parsed.success) {
      return c.text("BAD_REQUEST", 400);
    }
    return parsed.data;
  }),
  async (c) => {
    const validatedData = c.req.valid("json");
    const { title, content } = validatedData;

    const pdfBuffer = await exportPdf({ title, content });

    const filename = title
      ? `${title.replace(/\s+/g, "_").toLowerCase()}.pdf`
      : "document.pdf";

    return c.body(pdfBuffer as Uint8Array<ArrayBuffer>, 200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    });
  }
);

export default app;
