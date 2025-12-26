"use client";

import { textEditorSchema } from "@workspace/ui/editors/prosemirror-math/config";
import { DOMParser } from "prosemirror-model";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

/**
 * Processes diff markers in content and converts them to HTML ins/del tags
 * @param content String containing diff markers (/+/+ for additions, /-/- for deletions)
 * @returns String with diff markers replaced by appropriate HTML tags while preserving existing HTML structure
 */
export const processDiffMarkers = (content: string): string => {
  return content.replace(
    /\/\+\/\+([\s\S]*?)\/\+\/\+|\/\-\/\-([\s\S]*?)\/\-\/\-/g,
    (match, added, removed) => {
      if (added) {
        return added.replace(
          /(<[^>]*>)|([^<]+)/g,
          (m: string, tag: string, text: string) => tag || `<ins>${text}</ins>`
        );
      } else if (removed) {
        return removed.replace(
          /(<[^>]*>)|([^<]+)/g,
          (m: string, tag: string, text: string) => tag || `<del>${text}</del>`
        );
      }
      return match;
    }
  );
};

export const buildDocumentFromContent = (content: string) => {
  const parser = DOMParser.fromSchema(textEditorSchema);

  console.log("Content:", content);

  const processedContent = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(content)
    .toString()
    .replace(/\$\$(.*?)\$\$/gs, "<math-display>$1</math-display>")
    .replace(/\$(.*?)\$/gs, "<math-inline>$1</math-inline>")
    .replace(
      /<p><math-inline>(.*?)<\/math-inline><\/p>/gs,
      "<math-display>$1</math-display>"
    );

  const processedWithDiff = processDiffMarkers(processedContent);

  const tempContainer = document.createElement("div");
  tempContainer.innerHTML = processedWithDiff;

  return parser.parse(tempContainer);
};
