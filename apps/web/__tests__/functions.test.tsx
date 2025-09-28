import { createDiffViewString } from "@/lib/utils";
import {
  buildDocumentFromContent,
  processDiffMarkers,
} from "@workspace/ui/editors/functions";
import { describe, expect, test } from "vitest";

// Mock document.createElement since we're in a test environment
const mockElement = {
  innerHTML: "",
};

global.document = {
  createElement: () => mockElement,
} as any;

describe("buildDocumentFromContent", () => {
  test("processes basic markdown content", () => {
    const content = "# Hello\nThis is **bold**";
    buildDocumentFromContent(content);
    expect(mockElement.innerHTML).toContain("<h1>Hello</h1>");
    expect(mockElement.innerHTML).toContain("<strong>bold</strong>");
  });

  test("processes math expressions", () => {
    const content = "Inline math $x^2$ and display math $$\\sum_{i=1}^n i$$";
    buildDocumentFromContent(content);
    expect(mockElement.innerHTML).toContain("<math-inline>x^2</math-inline>");
    expect(mockElement.innerHTML).toContain(
      "<math-display>\\sum_{i=1}^n i</math-display>"
    );
  });

  test("processes diff markers with HTML structure", () => {
    const content = "/+/+<p>New content</p>/+/+ and /-/-<p>Old content</p>/-/-";
    const result = processDiffMarkers(content);
    expect(result).toContain("<p><ins>New content</ins></p>");
    expect(result).toContain("<p><del>Old content</del></p>");
  });

  test("handles complex nested HTML with diff markers", () => {
    const content =
      "/+/+<p><strong>Added</strong> content</p>/+/+ regular text /-/-<p>Removed <em>text</em></p>/-/-";
    const result = processDiffMarkers(content);
    expect(result).toContain(
      "<p><strong><ins>Added</ins></strong><ins> content</ins></p>"
    );
    expect(result).toContain("regular text");
    expect(result).toContain(
      "<p><del>Removed </del><em><del>text</del></em></p>"
    );
  });

  test("processes combined math and diff content", () => {
    const content = "/+/+Math: $x^2$/+/+ and /-/-$$\\int f(x)dx$$/-/-";
    buildDocumentFromContent(content);
    expect(mockElement.innerHTML).toContain(
      "<ins>Math: </ins><math-inline><ins>x^2</ins></math-inline>"
    );
    expect(mockElement.innerHTML).toContain(
      "<math-display><del>\\int f(x)dx</del></math-display>"
    );
  });

  test("handles less than symbols correctly", () => {
    const content = "if (x < 5) and (y > 10) them z = x + y";
    buildDocumentFromContent(content);
    expect(mockElement.innerHTML).not.toContain("<ins>");
    expect(mockElement.innerHTML).not.toContain("<del>");
  });
});

describe("createDiffViewString", () => {
  test("creates diff string with added and removed content", () => {
    const changes = [
      { value: "unchanged", added: false, removed: false },
      { value: "added", added: true },
      { value: "removed", removed: true },
    ];
    const result = createDiffViewString(changes, true);
    expect(result).toBe("unchanged/+/+added/+/+/-/-removed/-/-");
  });
});
