import { type Context } from "hono";
import DOMPurify from "isomorphic-dompurify";
import puppeteer from "puppeteer";
import { createPDFTemplate } from "../../utils/html-template.js";

export interface ExportPdfEvent {
  title: string;
  content: string;
}

export async function POST(c: Context) {
  const data = (await c.req.json()) as ExportPdfEvent;

  const { title, content } = data;

  // Validate title and content
  if (!title || !content) {
    return c.json(
      { error: "Missing required fields: title and content are required" },
      400
    );
  }

  if (typeof title !== "string" || typeof content !== "string") {
    return c.json({ error: "Title and content must be strings" }, 400);
  }

  if (title.length > 128) {
    return c.json({ error: `Title must be 128 characters or less` }, 400);
  }

  if (content.length > 32768) {
    return c.json({ error: `Content must be 32768 characters or less` }, 400);
  }

  const pdfBuffer = await exportPdf(data);
  return c.body(pdfBuffer as Uint8Array<ArrayBuffer>, 200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${
      title.replace(/\s+/g, "_").toLowerCase() || "Untitled document"
    }.pdf"`,
  });
}

const exportPdf = async ({
  title,
  content,
}: {
  title: string;
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

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, {
    waitUntil: "networkidle0",
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
