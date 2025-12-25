import * as z from "zod";

const filenameSchema = z
  .string()
  .min(3, {
    message: "Filename is required and must be at least 3 characters long.",
  })
  .max(64, {
    message: "Filename must be less than 64 characters.",
  })
  .regex(/^[a-zA-Z0-9_-\s.:]+$/, {
    message:
      "Filename can only contain letters, numbers, underscores, hyphens, whitespaces, periods and colons.",
  });

const extToMimes: Record<string, string[]> = {
  pdf: ["application/pdf"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  pptx: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  md: ["text/markdown", "text/x-markdown"],
  markdown: ["text/markdown", "text/x-markdown"],
  adoc: ["text/x-asciidoc", "text/asciidoc"],
  asciidoc: ["text/x-asciidoc", "text/asciidoc"],
  html: ["text/html"],
  htm: ["text/html"],
  xhtml: ["application/xhtml+xml"],
  csv: ["text/csv", "application/csv"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  bmp: ["image/bmp"],
  webp: ["image/webp"],
  vtt: ["text/vtt", "text/x-webvtt"],
  json: ["application/json"],
  xml: ["application/xml", "text/xml"],
};

export const allowedMimeTypes = Array.from(
  new Set(Object.values(extToMimes).flat())
);

const allowedExtensions = new Set(Object.keys(extToMimes));

export const filenameWithExtensionSchema = z.string().refine(
  (value) => {
    // Check there's an extension and it's one of the allowed ones (case-insensitive)
    const idx = value.lastIndexOf(".");
    if (idx === -1) return false;
    const ext = value.slice(idx + 1).toLowerCase();
    if (!allowedExtensions.has(ext)) return false;

    // Strip extension and validate base filename with existing filenameSchema
    const nameWithoutExt = value.slice(0, idx);

    return filenameSchema.safeParse(nameWithoutExt).success;
  },
  {
    message:
      "Filename must use one of the supported extensions and must exclude unsupported special characters.",
  }
);
